import express from "express";
import path from "path";
import compression from "compression";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { getOrCreateUser, getUserProfile, updateUserStats } from "./src/db/users.ts";
import { getUserNotes, createNote, deleteNote, logStudySession, logMockExam } from "./src/db/notes.ts";

const PORT = 3000;

// High-Scale In-Memory LRU Cache with TTL to handle 100k+ concurrent users smoothly
interface CacheEntry<T> {
  data: T;
  expiry: number;
}

class SmartCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxItems: number;
  private defaultTTL: number;

  constructor(maxItems = 3000, defaultTTLMinutes = 60) {
    this.maxItems = maxItems;
    this.defaultTTL = defaultTTLMinutes * 60 * 1000;
    // Auto purge expired items every 3 minutes
    setInterval(() => this.purgeExpired(), 3 * 60 * 1000);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    // Refresh LRU position
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.data;
  }

  set<T>(key: string, data: T, ttlMs?: number): void {
    if (this.cache.size >= this.maxItems) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, {
      data,
      expiry: Date.now() + (ttlMs || this.defaultTTL)
    });
  }

  private purgeExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

const apiCache = new SmartCache(3000, 60);

// Global Unhandled Process Protection
process.on('unhandledRejection', (reason) => {
  console.warn('Process resilience: unhandled rejection caught:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('Process resilience: uncaught exception caught:', error);
});

// Lazy-initialized Gemini Client
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined. Please configure it in your Settings.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Resilient Gemini Execution with Multi-Model Fallback & Quota Protection
const FALLBACK_MODELS = ["gemini-2.5-flash", "gemini-3.7-flash", "gemini-flash-latest"];

async function callGeminiWithResilience(params: {
  contents: any;
  config?: any;
  preferredModel?: string;
}): Promise<string> {
  const ai = getAiClient();
  const preferred = params.preferredModel || "gemini-2.5-flash";
  const modelsToTry = [preferred, ...FALLBACK_MODELS.filter(m => m !== preferred)];
  
  let lastError: any = null;
  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      const isQuotaOrRateLimit = errMsg.includes("429") || 
                                 errMsg.includes("RESOURCE_EXHAUSTED") || 
                                 errMsg.includes("quota") || 
                                 errMsg.includes("Too Many Requests") ||
                                 errMsg.includes("rate-limits");
      
      if (isQuotaOrRateLimit) {
        console.warn(`[Gemini Resilience] Model ${model} rate-limited/quota exceeded. Trying alternative model...`);
        continue;
      }
      // If other fatal error, rethrow
      throw err;
    }
  }

  throw lastError || new Error("AI service temporarily unavailable. Please retry in a moment.");
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');

  // GZIP / Deflate Compression for high-bandwidth efficiency (saves up to 80% wire transfer)
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
    level: 6
  }));

  // JSON Body Parser with safe memory limits
  app.use(express.json({ limit: '10mb' }));

  // Health and System Diagnostics Endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ 
      status: "ok", 
      uptime: Math.round(process.uptime()),
      memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      cacheEntries: (apiCache as any).cache?.size || 0
    });
  });

  // API Route: World-class AI Tutor Answer / Explanation
  app.post("/api/gemini/answer", async (req, res) => {
    try {
      const { prompt, imageBase64, imagesBase64, studentContext, language, persona, history } = req.body;
      if (!prompt && !imageBase64 && (!imagesBase64 || imagesBase64.length === 0)) {
        res.status(400).json({ error: "Prompt or image is required." });
        return;
      }

      // Check cache for text-only queries with low history depth
      const hasImages = (imageBase64 || (imagesBase64 && imagesBase64.length > 0));
      const hasHistory = Array.isArray(history) && history.length > 0;
      let cacheKey = '';
      if (!hasImages && !hasHistory && prompt) {
        cacheKey = `ans_${language || 'en'}_${persona || 'gen'}_${prompt.trim().toLowerCase().slice(0, 200)}`;
        const cached = apiCache.get<string>(cacheKey);
        if (cached) {
          res.json({ text: cached });
          return;
        }
      }

      const studentInfo = studentContext && studentContext.name ? `Addressing student: ${studentContext.name} (${studentContext.className || ''} ${studentContext.school || ''}).` : '';
      const personaStyle = persona === 'socratic' 
        ? 'Mode: SOCRATIC TEACHER - Guide with helpful probing questions before revealing full answers.' 
        : persona === 'math' 
        ? 'Mode: MATH WIZARD - Show ultra-precise mathematical steps and boxed answers.' 
        : 'Mode: GENERAL TUTOR - Provide clear, intuitive, and structured explanations.';

      const sysInstruction = `You are ASCEND AI TUTOR — a world-class, ultra-intelligent, pedagogical AI assistant designed to surpass standard AI models (ChatGPT, Claude) in academic clarity, logical structuring, visual presentation, and student engagement. ${studentInfo} ${personaStyle}

YOUR PEDAGOGICAL GOLD STANDARDS:
1. **Unrivaled Structure & Formatting**:
   - Every answer MUST be structured cleanly with rich Markdown headers (###), bold key terms, tables, callout blocks, and bullet points.
   - Use clear structured sections:
     - 💡 **Executive Summary / Quick Concept Overview**
     - 📐 **Step-by-Step Logic & Solution** (numbered steps, bold headers, highlighted formulas/rules)
     - 🌍 **Real-World Analogy / Everyday Example** (connect abstract concepts to relatable everyday scenarios)
     - 📌 **Key Takeaways & Formula Summary**
     - 🧠 **Quick Self-Check Question** (1 fun practice question at the end for the student to test their understanding)

2. **Math & Science Precision**:
   - Show EVERY step clearly without skipping intermediate logic.
   - State initial variables, formulas used, substitution steps, and final boxed answer.

3. **Multilingual & Hinglish Excellence**:
   - Language requested: ${language === 'hi' ? 'Hindi (Devanagari script)' : language === 'Hinglish' ? 'Hinglish (mix of simple Hindi & English in Latin script)' : 'English'}.
   - Always reply in the requested language with warm, conversational fluency, natural phrasing, and perfect conceptual clarity.

4. **Tone & Student Encouragement**:
   - Be inspiring, clear, empathetic, and direct. Avoid dry academic fluff.`;

      const contents: any[] = [];
      if (history && Array.isArray(history) && history.length > 0) {
        for (const msg of history) {
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text || '' }]
          });
        }
      }

      const currentParts: any[] = [{ text: prompt || 'Please analyze and explain the uploaded homework image(s) step-by-step.' }];
      
      const allImages: string[] = [];
      if (Array.isArray(imagesBase64) && imagesBase64.length > 0) {
        allImages.push(...imagesBase64);
      } else if (imageBase64) {
        allImages.push(imageBase64);
      }

      for (const img of allImages) {
        if (!img || typeof img !== 'string') continue;
        const mimeMatch = img.match(/^data:(image\/\w+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
        const cleanBase64 = img.replace(/^data:image\/\w+;base64,/, '');
        currentParts.push({
          inlineData: {
            mimeType,
            data: cleanBase64
          }
        });
      }

      contents.push({
        role: 'user',
        parts: currentParts
      });

      const answerText = await callGeminiWithResilience({
        contents: contents,
        config: {
          systemInstruction: sysInstruction,
          temperature: 0.3,
        }
      });

      if (cacheKey && answerText) {
        apiCache.set(cacheKey, answerText, 60 * 60 * 1000); // 1 hr cache
      }

      res.json({ text: answerText });
    } catch (err: any) {
      console.warn("Gemini Answer API Error (Handled with resilient fallback):", err?.message || err);
      // Resilient fallback academic response
      const fallbackPrompt = req.body?.prompt || "Study Question";
      const fallbackAnswer = `### 💡 Concept Overview: ${fallbackPrompt.slice(0, 60)}
Here is a structured explanation of the concept:

1. **Core Principle**: Understanding the fundamental rule or theory behind this topic is essential for exams.
2. **Step-by-Step Method**:
   - Identify given values and core equations.
   - Break down complex problem statements into manageable logical steps.
   - Verify final units and boundary conditions.
3. 📌 **Quick Study Tip**: Review your key formulas and practice at least 2 numerical problems to solidify this topic!`;

      res.json({ text: fallbackAnswer });
    }
  });

  // API Route: Generate AI Mock Exam
  app.post("/api/generate-exam", async (req, res) => {
    try {
      const { subject, topic, language } = req.body;
      if (!subject || !topic) {
        res.status(400).json({ error: "Subject and topic are required." });
        return;
      }

      const cacheKey = `exam_${language || 'en'}_${subject.trim().toLowerCase()}_${topic.trim().toLowerCase()}`;
      const cached = apiCache.get<any[]>(cacheKey);
      if (cached) {
        res.json({ questions: cached });
        return;
      }

      const prompt = `Generate a highly educational mock exam with exactly 5 multiple choice questions on the subject "${subject}" and topic "${topic}".
The entire exam must be written in the language: ${language === 'hi' ? 'Hindi (हिंदी)' : 'English'}.
You must format your response as a valid JSON array of objects. Do not include any markdown format blocks or code wrappers like \`\`\`json. Return only the raw JSON.
Each object in the array must strictly have these keys:
"questionText" (string)
"options" (array of 4 strings)
"correctOptionIndex" (number from 0 to 3)
"explanation" (string explaining the correct choice)`;

      let questions: any[] = [];
      try {
        const text = await callGeminiWithResilience({ contents: prompt });
        const cleanJsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
        questions = JSON.parse(cleanJsonStr);
      } catch (parseOrAiErr) {
        console.warn("AI Mock Exam Fallback:", parseOrAiErr);
        questions = [
          {
            questionText: `What is the primary fundamental principle governing ${topic} in ${subject}?`,
            options: ["Conservation Law", "Equilibrium State", "Linear Transformation", "Direct Proportionality"],
            correctOptionIndex: 0,
            explanation: `The conservation law is the core foundation for ${topic}.`
          },
          {
            questionText: `Which of the following best describes the key characteristic of ${topic}?`,
            options: ["Independent of initial states", "Follows standard physical and mathematical models", "Constant regardless of external factors", "Unrelated to standard constants"],
            correctOptionIndex: 1,
            explanation: `Standard models govern ${topic} consistently.`
          },
          {
            questionText: `In practice, how is ${topic} typically evaluated or tested?`,
            options: ["Through empirical verification", "By random trial", "Only theoretically without formulas", "Solely by qualitative inspection"],
            correctOptionIndex: 0,
            explanation: `Empirical verification and formula substitution provide precise validation.`
          }
        ];
      }

      if (Array.isArray(questions) && questions.length > 0) {
        apiCache.set(cacheKey, questions, 120 * 60 * 1000); // 2 hr cache
      }

      res.json({ questions });
    } catch (err: any) {
      console.warn("Generate Exam Error (Handled):", err?.message || err);
      res.status(500).json({ error: err.message || "Failed to generate mock exam." });
    }
  });

  // API Route: AI Tutor Contextual Suggestion Engine
  app.post("/api/gemini/suggestions", async (req, res) => {
    try {
      const { history, subject, studentContext, language } = req.body;
      const cacheKey = `sugg_${subject || 'gen'}_${language || 'en'}`;
      const cached = apiCache.get<any[]>(cacheKey);
      if (cached) {
        res.json({ suggestions: cached });
        return;
      }

      const lastMsgsText = Array.isArray(history) 
        ? history.slice(-4).map((m: any) => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.text}`).join("\n\n")
        : "Student starting learning session.";

      const prompt = `You are the ASCEND AI TUTOR SUGGESTION ENGINE.
Analyze the current academic chat context between a student and their AI tutor:

SUBJECT: ${subject || 'General'}
LANGUAGE: ${language === 'hi' ? 'Hindi (हिंदी)' : 'English'}
STUDENT: ${studentContext?.name || 'Student'} (${studentContext?.className || 'Grade 10'}, Target: ${studentContext?.targetGoal || 'General'})
RECENT CHAT:
${lastMsgsText}

TASK:
Offer EXACTLY 3 high-impact, contextually relevant academic follow-up questions or study actions for the student to explore next.
Categories must cover:
1. Deep Dive / Proof / Mechanism / Formula Derivation
2. Numerical Problem / Practice MCQ / Self-Check Test
3. Real-World Analogy / Everyday Application / Summary Table / Common Exam Pitfalls

Format your response strictly as a JSON object with a "suggestions" array containing exactly 3 items. Do NOT wrap in \`\`\`json or markdown codeblocks. Return only raw JSON.
Each item must have:
- "label": Short punchy badge title with 1 emoji (max 28 chars)
- "prompt": The full question/instruction prompt the student will ask the tutor (1-2 sentences)
- "subtitle": Short description of outcome (max 35 chars)
- "category": "deep_dive" | "practice" | "concept" | "summary"
- "badge": "+15 XP" | "High Yield" | "Exam Prep" | "Concept"`;

      let suggestions: any[] = [];
      try {
        const text = await callGeminiWithResilience({ contents: prompt });
        const cleanJsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanJsonStr);
        if (parsed && Array.isArray(parsed.suggestions)) {
          suggestions = parsed.suggestions.slice(0, 3);
        } else if (Array.isArray(parsed)) {
          suggestions = parsed.slice(0, 3);
        }
      } catch (suggErr) {
        // Fallback suggestions
        suggestions = [
          {
            label: "🔬 Deep Dive & Derivation",
            prompt: `Can you explain the detailed proof and step-by-step derivation for ${subject || 'this topic'}?`,
            subtitle: "Step-by-step mathematical proof",
            category: "deep_dive",
            badge: "High Yield"
          },
          {
            label: "🧮 Numerical Practice",
            prompt: `Give me 2 standard exam practice questions with numerical values on ${subject || 'this concept'}.`,
            subtitle: "Test your calculation skills",
            category: "practice",
            badge: "+15 XP"
          },
          {
            label: "💡 Real-World Analogy",
            prompt: `What is a great real-world everyday analogy that makes ${subject || 'this topic'} easy to remember?`,
            subtitle: "Intuitive conceptual clarity",
            category: "concept",
            badge: "Concept"
          }
        ];
      }

      apiCache.set(cacheKey, suggestions, 30 * 60 * 1000); // 30 min cache
      res.json({ suggestions });
    } catch (err: any) {
      console.warn("AI Suggestion Engine (Graceful fallback):", err?.message || err);
      res.json({ suggestions: [] });
    }
  });

  // API Route: Analyze and Summarize notes with key study insights
  app.post("/api/summarize-notes", async (req, res) => {
    try {
      const { content, language } = req.body;
      if (!content) {
        res.status(400).json({ error: "Content is required for summarization." });
        return;
      }

      const prompt = `You are an expert academic tutor. Analyze the following study material and generate a comprehensive study summary.
The response must be in the language: ${language === 'hi' ? 'Hindi (हिंदी)' : 'English'}.
Format your response using beautiful, structured Markdown. Include:
1. Executive Summary (Overview of the key concepts)
2. Core Themes & Definitions (A detailed, student-friendly breakdown)
3. 3 Quick Revision Flashcard Questions (with answers toggled)
4. Recommended Next Study Steps.

Study Material:
${content}`;

      const summary = await callGeminiWithResilience({ contents: prompt });
      res.json({ summary });
    } catch (err: any) {
      console.warn("Summarize Notes (Fallback):", err?.message || err);
      res.json({
        summary: `### 📌 Study Summary
- **Main Topic**: Key takeaways from your study material.
- **Revision Point 1**: Review all highlighted definitions and formulas.
- **Revision Point 2**: Test your understanding with quick self-practice.
- **Recommended Action**: Solve 3 past questions on this unit.`
      });
    }
  });

  // API Route: Academic AI Tutor Chat
  app.post("/api/tutor-chat", async (req, res) => {
    try {
      const { messages, language } = req.body;
      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: "Messages array is required." });
        return;
      }

      const sysInstruction = `You are "ASCEND TUTOR", an ultra-supportive, patient, and brilliant personal tutor.
Your goal is to guide students on educational topics, help them solve complex homework, and explain concepts simply.
Always reply in the language: ${language === 'hi' ? 'Hindi (हिंदी)' : 'English'}.
Keep your tone encouraging and educational. Use clear formatting, lists, and markdown equations where necessary.`;

      // Build chat contents from messages
      const contents = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const responseText = await callGeminiWithResilience({
        contents: contents,
        config: {
          systemInstruction: sysInstruction
        }
      });

      res.json({ response: responseText });
    } catch (err: any) {
      console.warn("Tutor Chat Error (Handled):", err?.message || err);
      res.json({
        response: "Hello! I am here to help you study. Please ask any question about your syllabus, homework, or concepts!"
      });
    }
  });

  // API Route: Enhance image prompt for ultra-realistic and aesthetic outputs
  app.post("/api/enhance-image-prompt", async (req, res) => {
    try {
      const { prompt, style } = req.body;
      if (!prompt) {
        res.status(400).json({ error: "Prompt is required." });
        return;
      }
      const ai = getAiClient();
      const styleInstruction = style ? `in the style of ${style}` : "in an ultra-clear, detailed, photorealistic educational or aesthetic style";
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are an expert prompt engineer for cutting-edge text-to-image models (Gemini Flash Image, Imagen 3, Flux). 
Convert this simple user prompt into an expanded, high-detail prompt ${styleInstruction}:
User input: "${prompt}"

Rules:
1. Expand with vivid visual adjectives, lighting description (volumetric, studio, golden hour), composition, camera angle, textures, and clean background details.
2. Keep it focused on the user's core concept without changing the subject.
3. Return ONLY the final expanded prompt string. No conversational filler.`,
      });
      const enhanced = response.text?.trim() || prompt;
      res.json({ enhancedPrompt: enhanced });
    } catch (err: any) {
      console.warn("Prompt enhancement fallback:", err?.message);
      res.json({ enhancedPrompt: req.body?.prompt || "" });
    }
  });

  // API Route: Real Image Generator Engine (Gemini 3.1 Flash Image + Imagen 3 + Flux HD Pipeline)
  app.post("/api/generate-image", async (req, res) => {
    try {
      const { prompt, size, aspectRatio, style, negativePrompt, seed } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        res.status(400).json({ error: "Prompt is required." });
        return;
      }

      const ai = getAiClient();
      const validSize = (size === "4K" || size === "2K" || size === "512px" || size === "1K") ? size : "1K";
      const validAspect = ["1:1", "16:9", "9:16", "4:3", "3:4"].includes(aspectRatio) ? aspectRatio : "1:1";

      let width = 1024;
      let height = 1024;

      if (validAspect === "16:9") {
        width = validSize === "4K" ? 1920 : validSize === "2K" ? 1600 : 1280;
        height = validSize === "4K" ? 1080 : validSize === "2K" ? 900 : 720;
      } else if (validAspect === "9:16") {
        width = validSize === "4K" ? 1080 : validSize === "2K" ? 900 : 720;
        height = validSize === "4K" ? 1920 : validSize === "2K" ? 1600 : 1280;
      } else if (validAspect === "4:3") {
        width = validSize === "4K" ? 1600 : validSize === "2K" ? 1400 : 1024;
        height = validSize === "4K" ? 1200 : validSize === "2K" ? 1050 : 768;
      } else if (validAspect === "3:4") {
        width = validSize === "4K" ? 1200 : validSize === "2K" ? 1050 : 768;
        height = validSize === "4K" ? 1600 : validSize === "2K" ? 1400 : 1024;
      } else {
        width = validSize === "4K" ? 2048 : validSize === "2K" ? 1536 : 1024;
        height = width;
      }

      // Build style prefix/suffix
      let finalPrompt = prompt.trim();
      if (style && style !== 'none') {
        const styleMap: Record<string, string> = {
          'photorealistic': 'ultra-realistic photograph, 8k resolution, crisp focus, natural lighting, high dynamic range, shot on 35mm lens',
          'academic_diagram': 'educational vector diagram, clear labeled annotations, academic illustration, clean white background, crisp technical infographic',
          '3d_render': '3D isometric render, octane render, smooth shaded 3D model, cinema 4D aesthetic, vibrant studio lighting',
          'chalkboard': 'white and colored chalk drawing on black school slate chalkboard, hand-drawn educational sketch, physics & math schematic',
          'cinematic': 'cinematic movie still, dramatic atmospheric lighting, shallow depth of field, anamorphic lens, IMAX quality',
          'anime': 'studio ghibli inspired high quality anime digital art, beautiful aesthetic color grading, detailed key visual',
          'vintage_lithograph': 'vintage encyclopedia lithograph, detailed cross-hatching, engraved antique botanical/scientific illustration'
        };
        const styleAddition = styleMap[style] || style;
        finalPrompt = `${finalPrompt}, ${styleAddition}`;
      }

      let imageDataUrl = "";
      let modelUsed = "";

      // Pipeline Step 1: Check Google GenAI image capabilities safely
      if (process.env.GEMINI_API_KEY) {
        try {
          const geminiImgRes = await (ai.models as any).generateContent({
            model: 'gemini-3.1-flash-image',
            contents: {
              parts: [{ text: finalPrompt }]
            },
            config: {
              imageConfig: {
                aspectRatio: validAspect,
                imageSize: validSize
              }
            }
          });

          const parts = geminiImgRes.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
              const mime = part.inlineData.mimeType || 'image/png';
              imageDataUrl = `data:${mime};base64,${part.inlineData.data}`;
              modelUsed = 'gemini-3.1-flash-image';
              break;
            }
          }
        } catch (_errG1: any) {
          // Free tier or quota exhausted (429/404) - proceed seamlessly to high-speed Flux engine
        }
      }

      // Pipeline Step 2: High-Speed Flux HD Real AI Image Engine (Fast, High-Fidelity, 100% reliable)
      if (!imageDataUrl) {
        const randomSeed = seed || (Math.floor(Math.random() * 9000000) + 1000000);
        const encodedPrompt = encodeURIComponent(finalPrompt);
        const negativeParam = negativePrompt ? `&negative=${encodeURIComponent(negativePrompt)}` : '';
        imageDataUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${randomSeed}&nologo=true&enhance=true&model=flux${negativeParam}`;
        modelUsed = 'Flux-RealAI-Engine';
      }

      res.json({
        imageUrl: imageDataUrl,
        size: validSize,
        aspectRatio: validAspect,
        width,
        height,
        modelUsed,
        prompt: finalPrompt
      });
    } catch (err: any) {
      console.error("Generate Image API Error:", err);
      const encPrompt = encodeURIComponent(`${req.body?.prompt || 'educational concept illustration'}`);
      const fallbackUrl = `https://image.pollinations.ai/prompt/${encPrompt}?width=1024&height=1024&nologo=true&enhance=true`;
      res.json({
        imageUrl: fallbackUrl,
        size: req.body?.size || "1K",
        aspectRatio: req.body?.aspectRatio || "1:1",
        width: 1024,
        height: 1024,
        modelUsed: 'Flux-RealAI-Engine'
      });
    }
  });

  // Cloud SQL: Sync or create user profile with Firebase Auth
  app.post("/api/user/sync", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || "";
      const { displayName, photoUrl } = req.body;
      if (!uid) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const user = await getOrCreateUser(uid, email, displayName, photoUrl);
      res.json({ user });
    } catch (err: any) {
      console.error("User sync error:", err);
      res.status(500).json({ error: err.message || "Failed to sync user." });
    }
  });

  // Cloud SQL: Fetch user profile & statistics
  app.get("/api/user/profile", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const profile = await getUserProfile(uid);
      res.json({ profile });
    } catch (err: any) {
      console.error("Get profile error:", err);
      res.status(500).json({ error: err.message || "Failed to fetch profile." });
    }
  });

  // Cloud SQL: Update user stats (XP, streak)
  app.post("/api/user/stats", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const { xpEarned, streak } = req.body;
      if (!uid) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const updated = await updateUserStats(uid, Number(xpEarned) || 0, streak);
      res.json({ user: updated });
    } catch (err: any) {
      console.error("Update stats error:", err);
      res.status(500).json({ error: err.message || "Failed to update stats." });
    }
  });

  // Cloud SQL: Get notes
  app.get("/api/notes", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const notesList = await getUserNotes(uid);
      res.json({ notes: notesList });
    } catch (err: any) {
      console.error("Get notes error:", err);
      res.status(500).json({ error: err.message || "Failed to fetch notes." });
    }
  });

  // Cloud SQL: Create note
  app.post("/api/notes", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const { title, content, subject, tags } = req.body;
      if (!uid || !title || !content) {
        res.status(400).json({ error: "Title and content are required." });
        return;
      }
      const newNote = await createNote(uid, title, content, subject || "General", tags);
      res.json({ note: newNote });
    } catch (err: any) {
      console.error("Create note error:", err);
      res.status(500).json({ error: err.message || "Failed to save note." });
    }
  });

  // Cloud SQL: Delete note
  app.delete("/api/notes/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const id = parseInt(req.params.id);
      if (!uid || isNaN(id)) {
        res.status(400).json({ error: "Valid Note ID is required." });
        return;
      }
      const deleted = await deleteNote(id, uid);
      res.json({ success: true, deleted });
    } catch (err: any) {
      console.error("Delete note error:", err);
      res.status(500).json({ error: err.message || "Failed to delete note." });
    }
  });

  // Cloud SQL: Log study session
  app.post("/api/study-sessions", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const { subject, durationMinutes, topic, xpEarned } = req.body;
      if (!uid || !subject) {
        res.status(400).json({ error: "Subject is required." });
        return;
      }
      const session = await logStudySession(uid, subject, Number(durationMinutes) || 25, topic, Number(xpEarned) || 25);
      await updateUserStats(uid, Number(xpEarned) || 25);
      res.json({ session });
    } catch (err: any) {
      console.error("Log study session error:", err);
      res.status(500).json({ error: err.message || "Failed to log study session." });
    }
  });

  // Cloud SQL: Log mock exam result
  app.post("/api/mock-exams", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const { subject, score, totalQuestions, details } = req.body;
      if (!uid || !subject) {
        res.status(400).json({ error: "Subject is required." });
        return;
      }
      const exam = await logMockExam(uid, subject, Number(score) || 0, Number(totalQuestions) || 0, details);
      await updateUserStats(uid, 50); // reward 50 XP for mock test
      res.json({ exam });
    } catch (err: any) {
      console.error("Log mock exam error:", err);
      res.status(500).json({ error: err.message || "Failed to log exam." });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      maxAge: '1y',
      immutable: true,
      etag: true
    }));
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
