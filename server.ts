import express from "express";
import { MockDatabase } from "./src/services/mockDb";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { FALLBACK_QUIZZES, getFallbackAnswer } from "./src/services/fallbackData";
import DatabaseConstructor from "better-sqlite3";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const PORT = 3000;

// Set up database
let db: any;
if (process.env.VERCEL) {
  console.log("Running on Vercel, bypassing better-sqlite3 and using MockDatabase.");
  db = new MockDatabase();
} else {
  try {
    db = new DatabaseConstructor("studybuddy.db");
    console.log("Successfully connected to SQLite database (studybuddy.db).");
  } catch (err) {
    console.warn("better-sqlite3 could not be loaded, falling back to MockDatabase:", err);
    db = new MockDatabase();
  }
}

// Ensure database tables exist
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      points INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      avatar TEXT
    );
    CREATE TABLE IF NOT EXISTS badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      badge_name TEXT,
      icon TEXT,
      date_earned DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      subject TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task TEXT NOT NULL,
      time TEXT,
      day TEXT,
      completed INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject TEXT,
      score INTEGER,
      total INTEGER,
      date DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS group_members (
      group_id INTEGER,
      user_id INTEGER,
      role TEXT DEFAULT 'member',
      PRIMARY KEY (group_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS group_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER,
      user_id INTEGER,
      text TEXT,
      image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS group_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER,
      title TEXT NOT NULL,
      content TEXT,
      updated_by INTEGER,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Seed a default user if none exists
    INSERT OR IGNORE INTO users (id, name, points, level) VALUES (1, 'Rohit Yadav', 0, 1);
    -- Seed some dummy users for leaderboard
    INSERT OR IGNORE INTO users (id, name, points, level) VALUES (2, 'Alice Smith', 450, 5);
    INSERT OR IGNORE INTO users (id, name, points, level) VALUES (3, 'Bob Johnson', 320, 3);
    INSERT OR IGNORE INTO users (id, name, points, level) VALUES (4, 'Charlie Brown', 150, 2);
  `);
} catch (e) {
  console.warn("Could not execute tables initialization SQL on database:", e);
}

// Gemini Client setup (Server-Side)
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not defined on the server side.");
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

/**
 * Executes a Gemini API call with automated retries and standard fallbacks.
 */
async function callGeminiWithRetryAndFailover(
  ai: any,
  params: {
    model: string;
    contents: any;
    config?: any;
  },
  retries = 3,
  delay = 1000
): Promise<any> {
  const isImageModel = params.model.indexOf("image") !== -1;
  const candidates = isImageModel 
    ? [params.model, "gemini-2.5-flash-image", "gemini-3.1-flash-image"] 
    : [params.model, "gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
  const modelsToTry = candidates.filter((item, index) => candidates.indexOf(item) === index);

  for (const modelCandidate of modelsToTry) {
    let currentRetries = retries;
    let currentDelay = delay;
    while (currentRetries >= 0) {
      try {
        const result = await ai.models.generateContent({
          ...params,
          model: modelCandidate,
        });
        if (!result || !result.text && !result.candidates) {
          throw new Error("Empty response received from Gemini.");
        }
        return result;
      } catch (error: any) {
        const errorMsg = error.message || String(error);
        const isTransient = error.status === 503 || error.statusCode === 503 || error.code === 503 || 
                            errorMsg.includes("503") || errorMsg.includes("UNAVAILABLE") || errorMsg.includes("high demand") || errorMsg.includes("temporary");
        
        if (isTransient && currentRetries > 0) {
          console.warn(`[Server Gemini Retry] Model ${modelCandidate} failed (${errorMsg}). Retrying in ${currentDelay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, currentDelay));
          currentRetries--;
          currentDelay *= 2;
        } else {
          console.warn(`[Server Gemini Fail] Call failed for model ${modelCandidate}:`, errorMsg);
          break; // Try next fallback model
        }
      }
    }
  }
  throw new Error("All candidate Gemini models failed after retries.");
}

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Gamification Helper
const addPoints = (userId: any, points: number) => {
  try {
    db.prepare("UPDATE users SET points = points + ? WHERE id = ?").run(points, userId);
    db.prepare("UPDATE users SET level = (points / 100) + 1 WHERE id = ?").run(userId);
  } catch (err) {
    console.error("Failed to add points:", err);
  }
};

// API Health Check Endpoint
app.get("/api/gemini/health", async (req, res) => {
  try {
    const ai = getGeminiClient();
    const response = await callGeminiWithRetryAndFailover(ai, {
      model: "gemini-3.5-flash",
      contents: "Test connection: respond with 'OK'",
    });
    if (response && response.text) {
      res.json({ status: "healthy", connection: "connected", result: response.text.trim() });
    } else {
      res.status(500).json({ status: "degraded", connection: "empty_response" });
    }
  } catch (err: any) {
    res.status(500).json({ status: "degraded", error: err.message || String(err) });
  }
});

// User profile and points endpoints
app.get("/api/user/:id", (req, res) => {
  try {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
    const badges = db.prepare("SELECT * FROM badges WHERE user_id = ?").all(req.params.id);
    res.json({ ...user, badges });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/leaderboard", (req, res) => {
  try {
    const leaderboard = db.prepare("SELECT name, points, level FROM users ORDER BY points DESC LIMIT 10").all();
    res.json(leaderboard);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/user/:id/points", (req, res) => {
  try {
    const { points } = req.body;
    addPoints(req.params.id, points);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/user/:id/badge", (req, res) => {
  try {
    const { badge_name, icon } = req.body;
    const exists = db.prepare("SELECT id FROM badges WHERE user_id = ? AND badge_name = ?").get(req.params.id, badge_name);
    if (!exists) {
      db.prepare("INSERT INTO badges (user_id, badge_name, icon) VALUES (?, ?, ?)").run(req.params.id, badge_name, icon);
      res.json({ success: true, unlocked: true });
    } else {
      res.json({ success: true, unlocked: false });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Personal Notes endpoints
app.get("/api/notes", (req, res) => {
  try {
    const notes = db.prepare("SELECT * FROM notes ORDER BY updated_at DESC").all();
    res.json(notes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/notes", (req, res) => {
  try {
    const { title, content, subject } = req.body;
    const result = db.prepare("INSERT INTO notes (title, content, subject) VALUES (?, ?, ?)").run(title, content, subject);
    res.json({ id: result.lastInsertRowid });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/notes/:id", (req, res) => {
  try {
    const { title, content, subject } = req.body;
    db.prepare("UPDATE notes SET title = ?, content = ?, subject = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(title, content, subject, req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/notes/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM notes WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Study Schedule endpoints
app.get("/api/schedule", (req, res) => {
  try {
    const schedule = db.prepare("SELECT * FROM schedule").all();
    res.json(schedule);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/schedule", (req, res) => {
  try {
    const { task, time, day } = req.body;
    const result = db.prepare("INSERT INTO schedule (task, time, day) VALUES (?, ?, ?)").run(task, time, day);
    res.json({ id: result.lastInsertRowid });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/schedule/:id", (req, res) => {
  try {
    const { completed } = req.body;
    db.prepare("UPDATE schedule SET completed = ? WHERE id = ?").run(completed ? 1 : 0, req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/schedule/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM schedule WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Progress logging endpoints
app.get("/api/progress", (req, res) => {
  try {
    const progress = db.prepare("SELECT * FROM progress ORDER BY date DESC").all();
    res.json(progress);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/progress", (req, res) => {
  try {
    const { subject, score, total } = req.body;
    db.prepare("INSERT INTO progress (subject, score, total) VALUES (?, ?, ?)").run(subject, score, total);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Study Groups endpoints
app.get("/api/groups", (req, res) => {
  try {
    const groups = db.prepare(`
      SELECT g.*, (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count 
      FROM groups g
    `).all();
    res.json(groups);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/groups/user/:userId", (req, res) => {
  try {
    const groups = db.prepare(`
      SELECT g.*, (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count 
      FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = ?
    `).all(req.params.userId);
    res.json(groups);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/groups", (req, res) => {
  try {
    const { name, description, userId } = req.body;
    const result = db.prepare("INSERT INTO groups (name, description, created_by) VALUES (?, ?, ?)").run(name, description, userId);
    const groupId = result.lastInsertRowid;
    db.prepare("INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)").run(groupId, userId, 'admin');
    res.json({ id: groupId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/groups/:id/join", (req, res) => {
  try {
    const { userId } = req.body;
    db.prepare("INSERT INTO group_members (group_id, user_id) VALUES (?, ?)").run(req.params.id, userId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: "Already a member or group doesn't exist" });
  }
});

app.get("/api/groups/:id/messages", (req, res) => {
  try {
    const messages = db.prepare(`
      SELECT gm.*, u.name as user_name 
      FROM group_messages gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = ?
      ORDER BY gm.created_at ASC
    `).all(req.params.id);
    res.json(messages);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/groups/:id/notes", (req, res) => {
  try {
    const notes = db.prepare(`
      SELECT gn.*, u.name as updated_by_name 
      FROM group_notes gn
      JOIN users u ON gn.updated_by = u.id
      WHERE gn.group_id = ?
      ORDER BY gn.updated_at DESC
    `).all(req.params.id);
    res.json(notes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/groups/:id/notes", (req, res) => {
  try {
    const { title, content, userId } = req.body;
    const result = db.prepare("INSERT INTO group_notes (group_id, title, content, updated_by) VALUES (?, ?, ?, ?)").run(req.params.id, title, content, userId);
    res.json({ id: result.lastInsertRowid });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/groups/notes/:noteId", (req, res) => {
  try {
    const { title, content, userId } = req.body;
    db.prepare("UPDATE group_notes SET title = ?, content = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(title, content, userId, req.params.noteId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Gemini AI Server endpoints
app.post("/api/gemini/answer", async (req, res) => {
  const { prompt, imageBase64, studentContext, language } = req.body;
  try {
    const parts: any[] = [{ text: prompt }];
    
    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/png",
          data: imageBase64.split(',')[1] || imageBase64
        }
      });
    }

    let languagePrompt = "";
    if (language === "Hindi") {
      languagePrompt = "Please respond entirely in clear, friendly Hindi language (using proper Devanagari script), offering simple student-friendly examples.";
    } else if (language === "Mixed" || language === "Hinglish") {
      languagePrompt = "Please respond in Hinglish (a friendly, conversational mix of Hindi and English). Keep academic/scientific vocabulary in English but explain and converse in simple mixed sentences, perfect for an Indian school kid.";
    } else if (language === "Marathi") {
      languagePrompt = "Please respond entirely in clear, friendly Marathi language (using proper Devanagari script), offering simple student-friendly examples.";
    } else if (language === "Tamil") {
      languagePrompt = "Please respond entirely in clear, friendly Tamil language, offering simple student-friendly examples.";
    } else if (language === "Bengali") {
      languagePrompt = "Please respond entirely in clear, friendly Bengali language, offering simple student-friendly examples.";
    } else if (language === "Spanish") {
      languagePrompt = "Please respond entirely in Spanish language, customized to be clear and encouraging for a school child.";
    } else if (language === "French") {
      languagePrompt = "Please respond entirely in French language, customized to be clear and encouraging for a school child.";
    } else if (language === "German") {
      languagePrompt = "Please respond entirely in German language, customized to be clear and encouraging for a school child.";
    } else if (language === "Japanese") {
      languagePrompt = "Please respond entirely in Japanese language, customized to be clear and encouraging for a school child.";
    } else {
      languagePrompt = "Please respond in English, styled to be simple, friendly and highly clear for a school child.";
    }

    const appInfo = "You are the AI model integrated into 'Ascend Study', an advanced, interactive study assistant platform. Ascend Study provides students with intelligent conversational learning, structured subject notes, dynamic practice quizzes, progress and daily streak tracking, study schedules/reminders, and collaborative group study circles/rooms for peer-to-peer interactive learning.";
    const creatorInfo = "Your owner, creator, and lead developer is Rohit Yadav, a brilliant 14/15-year-old student and coder who designed and developed this entire applet. Rohit is the head and founder of his developer team called 'Core AI'. If any student or user asks who created/developed you, who designed this app, or who owns you, you must proudly, clearly, and directly tell them that you were created and are owned by Rohit Yadav and his team, Core AI. You must never claim that Google, Google AI Studio, or OpenAI created or own you - they are only providers of the underlying large language model APIs, but the app itself and your persona belongs strictly to Rohit Yadav and Core AI.";

    const systemInstruction = studentContext 
      ? `${appInfo} ${creatorInfo} You are an encouraging, friendly study helper for a child named ${studentContext.name} who studies in class ${studentContext.className} at ${studentContext.school}. Explain concepts clearly using step-by-step solutions suitable for class/grade ${studentContext.className}. Support subjects like Math, Science, Biology, Physics, Chemistry, and English. Keep your tone highly personalized, warm, and highly encouraging, referring to their school or name when it fits naturally. ${languagePrompt}`
      : `${appInfo} ${creatorInfo} You are a helpful study assistant. Explain concepts clearly and provide step-by-step solutions. Support subjects like Math, Science, Biology, Physics, Chemistry, and English. If the user asks for a diagram or visual explanation, describe it clearly or suggest a visual aid. ${languagePrompt}`;

    const ai = getGeminiClient();
    const response = await callGeminiWithRetryAndFailover(ai, {
      model: "gemini-3.5-flash",
      contents: { parts },
      config: {
        systemInstruction: systemInstruction,
      }
    });
    
    res.json({ text: response.text });
  } catch (err: any) {
    console.warn("Gemini answer error (using offline fallback):", err.message || err);
    const fallbackText = getFallbackAnswer(prompt, studentContext);
    res.json({ text: fallbackText });
  }
});

app.post("/api/gemini/diagram", async (req, res) => {
  const { prompt } = req.body;
  try {
    const ai = getGeminiClient();
    const response = await callGeminiWithRetryAndFailover(ai, {
      model: "gemini-2.5-flash-image",
      contents: [{ text: `Educational diagram or illustration for: ${prompt}. Clear, academic style, labeled if necessary.` }],
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    let imageUrl = null;
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }
    res.json({ imageUrl });
  } catch (err: any) {
    console.warn("Gemini diagram error (returning null gracefully):", err.message || err);
    res.json({ imageUrl: null });
  }
});

app.post("/api/gemini/quiz", async (req, res) => {
  const { subject, studentContext, language } = req.body;
  const quizLang = language || "English";
  try {
    const classText = studentContext ? `for class/grade ${studentContext.className}` : "";
    
    let languageInstruct = "";
    if (quizLang === "Hindi") {
      languageInstruct = "entirely in Hindi language (using clear Devanagari script suitable for classroom study). All questions, descriptions, and option texts MUST be in clean Hindi.";
    } else if (quizLang === "Mixed" || quizLang === "Hinglish") {
      languageInstruct = "in Hinglish (a friendly, everyday mixture of Hindi and English words. Write sentences in standard blended phrasing - e.g. using English terms with Hindi scaffolding, like 'Photosynthesis process kiski presense me hota hai?'). Ensure it reads comfortably and is highly engaging.";
    } else if (quizLang === "Marathi") {
      languageInstruct = "entirely in Marathi language (using proper Devanagari script). All questions, descriptions, and option texts MUST be in clean Marathi.";
    } else if (quizLang === "Tamil") {
      languageInstruct = "entirely in Tamil language. All questions, descriptions, and option texts MUST be in clean Tamil.";
    } else if (quizLang === "Bengali") {
      languageInstruct = "entirely in Bengali language. All questions, descriptions, and option texts MUST be in clean Bengali.";
    } else if (quizLang === "Spanish") {
      languageInstruct = "entirely in clean, simple Spanish language suitable for school students.";
    } else if (quizLang === "French") {
      languageInstruct = "entirely in clean, simple French language suitable for school students.";
    } else if (quizLang === "German") {
      languageInstruct = "entirely in clean, simple German language suitable for school students.";
    } else if (quizLang === "Japanese") {
      languageInstruct = "entirely in clean, simple Japanese language suitable for school students.";
    } else {
      languageInstruct = "entirely in simple, school-grade English.";
    }

    const instructionText = `Generate a 5-question multiple choice quiz ${classText} for ${subject} ${languageInstruct} Return only valid JSON in the format: [{"question": "...", "options": ["...", "...", "...", "..."], "answer": 0}]`;

    const ai = getGeminiClient();
    const response = await callGeminiWithRetryAndFailover(ai, {
      model: "gemini-3.5-flash",
      contents: instructionText,
      config: {
        responseMimeType: "application/json"
      }
    });
    
    let quizData = [];
    try {
      quizData = JSON.parse(response.text || "[]");
    } catch (parseErr) {
      console.error("Quiz JSON parse error:", parseErr, "Text:", response.text);
    }
    
    if (Array.isArray(quizData) && quizData.length > 0) {
      res.json(quizData);
    } else {
      throw new Error("Invalid or empty response format received from upstream API model");
    }
  } catch (err: any) {
    console.warn("Gemini quiz error (using high-quality localized fallback database):", err.message || err);
    const languageKey = (quizLang === "Hindi" ? "Hindi" : "English") as "Hindi" | "English";
    const fallbackSet = FALLBACK_QUIZZES[subject]?.[languageKey] || FALLBACK_QUIZZES[subject]?.["English"] || [];
    res.json(fallbackSet);
  }
});

app.post("/api/gemini/flashcard", async (req, res) => {
  const { subject, noteTitle, noteContent, count = 5 } = req.body;
  try {
    const contextText = noteContent 
      ? `based on this study note titled "${noteTitle || 'Untitled'}" with content: "${noteContent}"`
      : `for general study of the subject "${subject}"`;

    const instructionText = `You are an expert school tutor. Generate exactly ${count} educational study flashcards ${contextText}.
Identify key terms, definitions, formulas, or concepts. For each, create a brief, clear, engaging question or term for the "front" and a precise, easy-to-understand answer or explanation for the "back".
Return ONLY valid JSON in the format: [{"front": "...", "back": "..."}]`;

    const ai = getGeminiClient();
    const response = await callGeminiWithRetryAndFailover(ai, {
      model: "gemini-3.5-flash",
      contents: instructionText,
      config: {
        responseMimeType: "application/json"
      }
    });

    let flashcardsData = [];
    try {
      flashcardsData = JSON.parse(response.text || "[]");
    } catch (parseErr) {
      console.error("Flashcards JSON parse error:", parseErr, "Text:", response.text);
    }

    if (Array.isArray(flashcardsData) && flashcardsData.length > 0) {
      res.json(flashcardsData);
    } else {
      throw new Error("Invalid or empty response format received from upstream API model for flashcards");
    }
  } catch (err: any) {
    console.warn("Gemini flashcard generation error (using fallback):", err.message || err);
    // Generic high-quality fallbacks
    const FALLBACK_FLASHCARDS: Record<string, Array<{ front: string; back: string }>> = {
      "Mathematics": [
        { front: "What is Pythagoras theorem?", back: "a² + b² = c², where c is the hypotenuse and a, b are the other two sides of a right-angled triangle." },
        { front: "Formula for area of a circle", back: "Area = πr²" },
        { front: "What is a prime number?", back: "A number greater than 1 that has only two factors: 1 and itself (e.g. 2, 3, 5, 7)." }
      ],
      "Science": [
        { front: "What is photosynthesis?", back: "The process by which plants use sunlight, water, and carbon dioxide to create oxygen and energy in the form of sugar." },
        { front: "Three states of matter", back: "Solid, Liquid, Gas" },
        { front: "What is gravity?", back: "The force that pulls objects toward each other, like the earth pulling down on us." }
      ],
      "Biology": [
        { front: "What is the powerhouse of the cell?", back: "Mitochondria - they generate chemical energy for cellular activities." },
        { front: "Function of red blood cells", back: "To carry oxygen from the lungs to the rest of the body." }
      ],
      "Physics": [
        { front: "Newton's First Law of Motion", back: "An object at rest stays at rest, and an object in motion stays in motion with the same speed and direction unless acted upon by an external force." },
        { front: "Formula for speed", back: "Speed = Distance / Time" }
      ],
      "Chemistry": [
        { front: "What is the chemical formula for water?", back: "H₂O" },
        { front: "What is an atom?", back: "The basic unit of a chemical element, consisting of a nucleus of protons and neutrons, with electrons orbiting." }
      ],
      "English": [
        { front: "What is a noun?", back: "A word that represents a person, place, thing, or idea." },
        { front: "What is a metaphor?", back: "A figure of speech in which a word or phrase is applied to an object or action to which it is not literally applicable, describing it by comparison." }
      ]
    };
    const subjectKey = (subject || "Science") as string;
    const cards = FALLBACK_FLASHCARDS[subjectKey] || FALLBACK_FLASHCARDS["Science"];
    res.json(cards);
  }
});

// Socket.io connection logic
io.on("connection", (socket) => {
  socket.on("join-group", (groupId) => {
    socket.join(`group-${groupId}`);
  });

  socket.on("send-message", (data) => {
    try {
      const { groupId, userId, text, image } = data;
      const result = db.prepare("INSERT INTO group_messages (group_id, user_id, text, image) VALUES (?, ?, ?, ?)").run(groupId, userId, text, image);
      const user = db.prepare("SELECT name FROM users WHERE id = ?").get(userId);
      
      const newMessage = {
        id: result.lastInsertRowid,
        group_id: groupId,
        user_id: userId,
        user_name: user ? user.name : "Unknown Student",
        text,
        image,
        created_at: new Date().toISOString()
      };

      io.to(`group-${groupId}`).emit("new-message", newMessage);
    } catch (err) {
      console.error("Socket send-message error:", err);
    }
  });

  socket.on("update-note", (data) => {
    try {
      const { noteId, groupId, title, content, userId } = data;
      db.prepare("UPDATE group_notes SET title = ?, content = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(title, content, userId, noteId);
      const user = db.prepare("SELECT name FROM users WHERE id = ?").get(userId);
      
      const updatedNote = {
        id: noteId,
        group_id: groupId,
        title,
        content,
        updated_by: userId,
        updated_by_name: user ? user.name : "Unknown Student",
        updated_at: new Date().toISOString()
      };

      io.to(`group-${groupId}`).emit("note-updated", updatedNote);
    } catch (err) {
      console.error("Socket update-note error:", err);
    }
  });
});

// Vite & Static Asset Handling Middleware
async function initializeViteAndStaticAssets() {
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static frontend files
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

// Startup connection test
async function testGeminiOnStartup() {
  try {
    const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!key) {
      console.warn("⚠️  [Startup] No Gemini API key found in server variables (GEMINI_API_KEY / VITE_GEMINI_API_KEY). Fallbacks will be active.");
      return;
    }
    console.log("🚀 [Startup] Running Gemini API health connection test with failover...");
    const ai = getGeminiClient();
    const response = await callGeminiWithRetryAndFailover(ai, {
      model: "gemini-3.5-flash",
      contents: "API connection validation. Return exactly the word 'SUCCESS'.",
    });
    console.log(`✅ [Startup] Gemini API connection test SUCCEEDED: "${response.text?.trim()}"`);
  } catch (err: any) {
    console.warn(`❌ [Startup] Gemini API connection test FAILED: ${err.message || String(err)}`);
    console.warn("⚠️  [Startup] Falling back to high-quality localized datasets for offline functionality.");
  }
}

// Start local HTTP server if NOT inside a serverless / VERCEL environment
async function boot() {
  await initializeViteAndStaticAssets();
  
  if (!process.env.VERCEL) {
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`Server successfully started locally on http://localhost:${PORT}`);
    });
    // Trigger lazy startup checks asynchronously
    testGeminiOnStartup().catch(console.error);
  }
}

boot().catch((err) => {
  console.error("Fatal server boot failure:", err);
});

// Export default Express app for Vercel Serverless Function compatibility
export default app;
export { app };
