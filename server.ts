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
"explanation" (string explaining the correct choice)

Example of correct JSON output:
[
  {
    "questionText": "Question here?",
    "options": ["Opt1", "Opt2", "Opt3", "Opt4"],
    "correctOptionIndex": 1,
    "explanation": "Explanation here."
  }
]`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const text = response.text || "";
      // Clean JSON delimiters if the model output them despite instructions
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
        model: "gemini-3.5-flash",
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
        model: "gemini-3.5-flash",
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
