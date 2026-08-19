import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const PORT = 3000;

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

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // API Route: World-class AI Tutor Answer / Explanation
  app.post("/api/gemini/answer", async (req, res) => {
    try {
      const { prompt, imageBase64, studentContext, language, persona, history } = req.body;
      if (!prompt) {
        res.status(400).json({ error: "Prompt is required." });
        return;
      }

      const ai = getAiClient();

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

      const currentParts: any[] = [{ text: prompt }];
      if (imageBase64) {
        const mimeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
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

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
          systemInstruction: sysInstruction,
          temperature: 0.3,
        }
      });

      res.json({ text: response.text || "" });
    } catch (err: any) {
      console.error("Gemini Answer API Error:", err);
      res.status(500).json({ error: err.message || "Failed to generate answer." });
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

      const ai = getAiClient();
      const prompt = `Generate a highly educational mock exam with exactly 5 multiple choice questions on the subject "${subject}" and topic "${topic}".
The entire exam must be written in the language: ${language === 'hi' ? 'Hindi (हिंदी)' : 'English'}.
You must format your response as a valid JSON array of objects. Do not include any markdown format blocks or code wrappers like \`\`\`json. Return only the raw JSON.
Each object in the array must strictly have these keys:
"questionText" (string)
"options" (array of 4 strings)
"correctOptionIndex" (number from 0 to 3)
"explanation" (string explaining the correct choice)`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const text = response.text || "";
      const cleanJsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const questions = JSON.parse(cleanJsonStr);

      res.json({ questions });
    } catch (err: any) {
      console.error("Generate Exam Error:", err);
      res.status(500).json({ error: err.message || "Failed to generate mock exam." });
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

      const ai = getAiClient();
      const prompt = `You are an expert academic tutor. Analyze the following study material and generate a comprehensive study summary.
The response must be in the language: ${language === 'hi' ? 'Hindi (हिंदी)' : 'English'}.
Format your response using beautiful, structured Markdown. Include:
1. Executive Summary (Overview of the key concepts)
2. Core Themes & Definitions (A detailed, student-friendly breakdown)
3. 3 Quick Revision Flashcard Questions (with answers toggled)
4. Recommended Next Study Steps.

Study Material:
${content}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      res.json({ summary: response.text || "" });
    } catch (err: any) {
      console.error("Summarize Notes Error:", err);
      res.status(500).json({ error: err.message || "Failed to analyze study material." });
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

      const ai = getAiClient();
      const sysInstruction = `You are "ASCEND TUTOR", an ultra-supportive, patient, and brilliant personal tutor.
Your goal is to guide students on educational topics, help them solve complex homework, and explain concepts simply.
Always reply in the language: ${language === 'hi' ? 'Hindi (हिंदी)' : 'English'}.
Keep your tone encouraging and educational. Use clear formatting, lists, and markdown equations where necessary.`;

      // Build chat contents from messages
      const contents = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
          systemInstruction: sysInstruction
        }
      });

      res.json({ response: response.text || "" });
    } catch (err: any) {
      console.error("Tutor Chat Error:", err);
      res.status(500).json({ error: err.message || "Tutor failed to respond." });
    }
  });

  // API Route: Generate High-Quality Academic Images (Imagen + Reliable Fallback)
  app.post("/api/generate-image", async (req, res) => {
    try {
      const { prompt, size, aspectRatio } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        res.status(400).json({ error: "Prompt is required." });
        return;
      }

      const ai = getAiClient();
      const validSize = (size === "4K" || size === "2K" || size === "512px" || size === "1K") ? size : "1K";
      const validAspect = aspectRatio || "1:1";

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
      } else {
        width = validSize === "4K" ? 2048 : validSize === "2K" ? 1536 : 1024;
        height = width;
      }

      let imageDataUrl = "";

      // Attempt 1: imagen-3.0-generate-002
      try {
        const imgRes = await ai.models.generateImages({
          model: "imagen-3.0-generate-002",
          prompt: prompt,
          config: {
            numberOfImages: 1,
            outputMimeType: "image/png",
            aspectRatio: validAspect,
          },
        });

        if (imgRes.generatedImages && imgRes.generatedImages.length > 0) {
          const base64Bytes = imgRes.generatedImages[0]?.image?.imageBytes;
          if (base64Bytes) {
            imageDataUrl = `data:image/png;base64,${base64Bytes}`;
          }
        }
      } catch (err1: any) {
        console.warn("imagen-3.0-generate-002 failed:", err1?.message || err1);

        // Attempt 2: imagen-3.0-fast-generate-001
        try {
          const fallbackRes = await ai.models.generateImages({
            model: "imagen-3.0-fast-generate-001",
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: "image/png",
              aspectRatio: validAspect,
            },
          });
          if (fallbackRes.generatedImages && fallbackRes.generatedImages.length > 0) {
            const base64Bytes = fallbackRes.generatedImages[0]?.image?.imageBytes;
            if (base64Bytes) {
              imageDataUrl = `data:image/png;base64,${base64Bytes}`;
            }
          }
        } catch (err2: any) {
          console.warn("imagen-3.0-fast-generate-001 failed:", err2?.message || err2);
        }
      }

      // High quality fallback: Pollinations AI Image Service
      if (!imageDataUrl) {
        const encPrompt = encodeURIComponent(`${prompt}, educational academic diagram, clear detailed illustration`);
        const randomSeed = Math.floor(Math.random() * 900000) + 100000;
        imageDataUrl = `https://image.pollinations.ai/prompt/${encPrompt}?width=${width}&height=${height}&seed=${randomSeed}&nologo=true&enhance=true`;
      }

      res.json({ imageUrl: imageDataUrl, size: validSize, aspectRatio: validAspect });
    } catch (err: any) {
      console.error("Generate Image API Error:", err);
      // Fallback response instead of 500
      const encPrompt = encodeURIComponent(`${req.body?.prompt || 'study diagram'}, educational illustration`);
      const fallbackUrl = `https://image.pollinations.ai/prompt/${encPrompt}?width=1024&height=1024&nologo=true`;
      res.json({ imageUrl: fallbackUrl, size: req.body?.size || "1K", aspectRatio: req.body?.aspectRatio || "1:1" });
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
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
