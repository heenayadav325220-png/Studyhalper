import express from "express";
import { MockDatabase } from "./src/services/mockDb";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { FALLBACK_QUIZZES, getFallbackAnswer } from "./src/services/fallbackData";
import DatabaseConstructor from "better-sqlite3";
import { initializeApp as initAdminApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";

dotenv.config();

// Initialize Firebase Admin SDK
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    initAdminApp({
      projectId: firebaseConfig.projectId
    });
    console.log("Successfully initialized Firebase Admin for Project:", firebaseConfig.projectId);
  } else {
    initAdminApp();
    console.log("Initialized Firebase Admin with default configuration.");
  }
} catch (err) {
  console.warn("Firebase Admin SDK could not be initialized. Verify credentials or settings.", err);
}

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
    try {
      db.pragma("journal_mode = WAL");
      db.pragma("synchronous = NORMAL");
      console.log("Enabled Write-Ahead Logging (WAL) and synchronous=NORMAL for peak SQLite scalability.");
    } catch (pe) {
      console.warn("Could not set database pragmas:", pe);
    }
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
  const hasModelsPrefix = params.model.startsWith("models/");
  const baseCandidates = isImageModel 
    ? [params.model, "gemini-3.1-flash-lite-image", "gemini-3.1-flash-image"] 
    : [
        params.model,
        "gemini-3.5-flash",
        "gemini-3.1-flash-lite",
        "gemini-flash-latest"
      ];
  const candidates = baseCandidates.map(m => {
    if (hasModelsPrefix && !m.startsWith("models/")) {
      return `models/${m}`;
    }
    return m;
  });
  const modelsToTry = candidates.filter((item, index) => candidates.indexOf(item) === index);

  let lastError: any = null;
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
        lastError = error;
        const errorMsg = error.message || String(error);
        const isTransient = error.status === 503 || error.statusCode === 503 || error.code === 503 || 
                            errorMsg.includes("503") || errorMsg.includes("UNAVAILABLE") || errorMsg.includes("high demand") || errorMsg.includes("temporary");
        
        const isQuota = error.status === 429 || error.statusCode === 429 || error.code === 429 ||
                        errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED") ||
                        errorMsg.includes("quota") || errorMsg.includes("limit");

        const currentModelIndex = modelsToTry.indexOf(modelCandidate);
        const hasNextCandidate = currentModelIndex < modelsToTry.length - 1;

        if (isQuota && hasNextCandidate) {
          console.warn(`[Gemini Bridge] Model ${modelCandidate} hit rate limit. Trying fallback candidate model...`);
          break; // Break the while retry loop to let the outer loop try the next candidate model immediately!
        } else if (isQuota && currentRetries > 0) {
          let waitTimeMs = 5000; // default wait for quota
          const match = errorMsg.match(/Please retry in ([\d\.]+)s/i);
          if (match && match[1]) {
            const seconds = parseFloat(match[1]);
            if (!isNaN(seconds)) {
              waitTimeMs = Math.ceil(seconds * 1000) + 1500; // Wait specified time plus 1.5 seconds buffer
            }
          } else {
            waitTimeMs = currentDelay * 3;
          }

          if (waitTimeMs > 25000) {
            waitTimeMs = 25000; // Cap at 25 seconds
          }

          console.warn(`[Gemini Bridge] Model ${modelCandidate} rate limited. Waiting ${waitTimeMs}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, waitTimeMs));
          currentRetries--;
          currentDelay *= 2;
        } else if (isTransient && currentRetries > 0) {
          console.warn(`[Gemini Bridge] Model ${modelCandidate} temporarily unavailable. Retrying in ${currentDelay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, currentDelay));
          currentRetries--;
          currentDelay *= 2;
        } else {
          console.warn(`[Gemini Bridge] Model ${modelCandidate} skipped. Transitioning to next candidate...`);
          break; // Try next fallback model
        }
      }
    }
  }
  const finalMessage = lastError ? (lastError.message || String(lastError)) : "All candidate Gemini models failed after retries.";
  const finalError = new Error(`All candidate Gemini models failed after retries. Detail: ${finalMessage}`);
  if (lastError) {
    (finalError as any).status = lastError.status || lastError.statusCode || lastError.code;
  }
  throw finalError;
}

function handleRouteError(res: any, err: any) {
  res.setHeader("x-gemini-fallback", "true");
  const errMsg = err?.message || String(err);
  const status = err?.status || err?.statusCode || err?.code;
  if (
    status === 429 ||
    errMsg.includes("quota") || 
    errMsg.includes("429") || 
    errMsg.includes("RESOURCE_EXHAUSTED") ||
    errMsg.includes("limit")
  ) {
    res.setHeader("x-gemini-quota-exceeded", "true");
  }
}

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Authentication Middleware using Firebase Admin SDK
async function requireAuth(req: any, res: any, next: any) {
  // Allow health checks or pre-flight requests to pass without authentication
  if (req.method === "OPTIONS" || req.path === "/api/gemini/health" || req.path === "/health") {
    return next();
  }

  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // Graceful fallback for non-production environments to prevent blocking developers
    if (process.env.NODE_ENV !== "production") {
      console.warn("[Auth Middleware] Missing Authorization header, bypassing in non-production.");
      return next();
    }
    return res.status(401).json({ error: "Unauthorized. Authorization header is missing." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    req.userId = decodedToken.uid;
    next();
  } catch (error: any) {
    console.error("[Auth Middleware] Firebase ID token verification failed:", error.message || error);
    if (process.env.NODE_ENV !== "production") {
      console.warn("[Auth Middleware] Token verification failed, bypassing in non-production.");
      return next();
    }
    return res.status(401).json({ error: "Unauthorized. Invalid token.", detail: error.message });
  }
}

// Secure all Gemini endpoints with requireAuth middleware
app.use("/api/gemini", requireAuth);

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
    } else if (language === "Russian") {
      languagePrompt = "Please respond entirely in Russian language, customized to be clear and encouraging for a Russian school child.";
    } else if (language === "Chinese") {
      languagePrompt = "Please respond entirely in Chinese (Simplified) language, customized to be clear and encouraging for a Chinese school child.";
    } else {
      languagePrompt = "Please respond in English, styled to be simple, friendly and highly clear for a school child.";
    }

    let syllabusPrompt = "";
    if (studentContext) {
      const country = studentContext.country || "Global";
      const className = studentContext.className || "10";
      if (country === "Russia") {
        syllabusPrompt = `You must strictly follow the Russian National Educational Syllabus (Государственная программа / ФГОС) for grade/class ${className}. All academic standards, terminology, reference formulas, and pedagogy must be tailored to the Russian standard curriculum. Speak in Russian.`;
      } else if (country === "China") {
        syllabusPrompt = `You must strictly follow the Chinese National Curriculum Standard (国家课程标准) / Gaokao-aligned pathway for grade/class ${className}. All academic standards, terminology, reference formulas, and pedagogy must match the Chinese educational system. Speak in Chinese.`;
      } else if (country === "United States") {
        syllabusPrompt = `You must strictly follow the US Common Core / Next Generation Science Standards (NGSS) or AP/honors standards for grade/class ${className}. Tailor academic terminology and curriculum standards to the United States educational system.`;
      } else if (country === "India") {
        syllabusPrompt = `You must strictly follow the Indian CBSE (NCERT) / ICSE / State Board curriculum for grade/class ${className}. Tailor explanations, topics, and terms to the Indian schooling system.`;
      } else if (country === "United Kingdom") {
        syllabusPrompt = `You must strictly follow the National Curriculum of England / GCSE / Key Stage curriculum for grade/class ${className}. Tailor spelling, terms (like Key Stages) and curriculum standards to the UK school system.`;
      } else {
        syllabusPrompt = `You must follow an internationally recognized global curriculum standard such as the International Baccalaureate (IB) or Cambridge Assessment International Education (CIE) suitable for grade/class ${className}.`;
      }
    }

    const appInfo = "You are the AI model integrated into 'Ascend Study', an advanced, interactive study assistant platform. Ascend Study provides students with intelligent conversational learning, structured subject notes, dynamic practice quizzes, progress and daily streak tracking, study schedules/reminders, and collaborative group study circles/rooms for peer-to-peer interactive learning.";
    const creatorInfo = "Your owner, creator, and lead developer is Rohit Yadav, a brilliant 14/15-year-old student and coder who designed and developed this entire applet. Rohit is the head and founder of his developer team called 'Core AI'. If any student or user asks who created/developed you, who designed this app, or who owns you, you must proudly, clearly, and directly tell them that you were created and are owned by Rohit Yadav and his team, Core AI. You must never claim that Google, Google AI Studio, or OpenAI created or own you - they are only providers of the underlying large language model APIs, but the app itself and your persona belongs strictly to Rohit Yadav and Core AI.";

    const systemInstruction = studentContext 
      ? `${appInfo} ${creatorInfo} You are an encouraging, friendly study helper/coach for a child named ${studentContext.name} who studies in class ${studentContext.className} at ${studentContext.school}. ${syllabusPrompt} Keep your tone highly personalized, warm, and highly encouraging, referring to their school or name when it fits naturally. ${languagePrompt}`
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
    handleRouteError(res, err);
    const fallbackText = getFallbackAnswer(prompt, studentContext);
    res.json({ text: fallbackText });
  }
});

function generateGuaranteedLocalSvg(prompt: string): string {
  const normalized = (prompt || "").toLowerCase();
  
  if (normalized.includes("water cycle")) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="100%" height="100%">
      <!-- Background -->
      <rect width="600" height="400" fill="#f8fafc" rx="16"/>
      <rect width="600" height="150" y="250" fill="#e0f2fe" rx="0"/>
      
      <!-- Ocean -->
      <path d="M 0 320 Q 150 310 300 320 T 600 320 L 600 400 L 0 400 Z" fill="#0284c7"/>
      <path d="M 0 340 Q 150 330 300 340 T 600 340 L 600 400 L 0 400 Z" fill="#0369a1"/>
      
      <!-- Mountains -->
      <path d="M 350 320 L 450 180 L 520 260 L 600 150 L 600 320 Z" fill="#64748b"/>
      <path d="M 430 208 L 450 180 L 470 208 Z" fill="#f1f5f9"/>
      <path d="M 570 190 L 600 150 L 600 210 Z" fill="#f1f5f9"/>

      <!-- Sun -->
      <circle cx="80" cy="80" r="30" fill="#eab308" />
      <line x1="80" y1="35" x2="80" y2="20" stroke="#eab308" stroke-width="4"/>
      <line x1="80" y1="125" x2="80" y2="140" stroke="#eab308" stroke-width="4"/>
      <line x1="35" y1="80" x2="20" y2="80" stroke="#eab308" stroke-width="4"/>
      <line x1="125" y1="80" x2="140" y2="80" stroke="#eab308" stroke-width="4"/>
      
      <!-- Clouds -->
      <path d="M 240 100 a 20 20 0 0 1 30 -10 a 25 25 0 0 1 45 5 a 20 20 0 0 1 15 25 l -90 0 z" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="2"/>
      <path d="M 440 100 a 20 20 0 0 1 30 -10 a 25 25 0 0 1 45 5 a 20 20 0 0 1 15 25 l -90 0 z" fill="#94a3b8" stroke="#475569" stroke-width="2"/>

      <!-- Rain -->
      <line x1="460" y1="140" x2="450" y2="160" stroke="#38bdf8" stroke-width="2" stroke-dasharray="4 4"/>
      <line x1="480" y1="140" x2="470" y2="160" stroke="#38bdf8" stroke-width="2" stroke-dasharray="4 4"/>
      <line x1="500" y1="140" x2="490" y2="160" stroke="#38bdf8" stroke-width="2" stroke-dasharray="4 4"/>
      
      <!-- Arrows (Cycles) -->
      <!-- Evaporation -->
      <path d="M 120 290 Q 140 230 180 190" fill="none" stroke="#f97316" stroke-width="3" stroke-dasharray="5 5" marker-end="url(#arrow-orange)"/>
      <text x="130" y="220" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#ea580c">1. Evaporation</text>

      <!-- Condensation -->
      <path d="M 280 90 Q 350 80 400 90" fill="none" stroke="#2563eb" stroke-width="3" stroke-dasharray="5 5" marker-end="url(#arrow-blue)"/>
      <text x="310" y="75" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#1d4ed8">2. Condensation</text>

      <!-- Precipitation -->
      <path d="M 500 170 Q 520 230 490 280" fill="none" stroke="#0284c7" stroke-width="3" stroke-dasharray="5 5" marker-end="url(#arrow-blue)"/>
      <text x="515" y="230" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#0369a1">3. Precipitation</text>

      <!-- Collection / Runoff -->
      <path d="M 420 310 Q 260 350 160 340" fill="none" stroke="#0d9488" stroke-width="3" stroke-dasharray="5 5" marker-end="url(#arrow-teal)"/>
      <text x="260" y="360" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#0f766e">4. Surface Runoff</text>
      
      <!-- Definitions -->
      <defs>
        <marker id="arrow-orange" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#ea580c"/>
        </marker>
        <marker id="arrow-blue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#1d4ed8"/>
        </marker>
        <marker id="arrow-teal" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#0f766e"/>
        </marker>
      </defs>

      <!-- Label title -->
      <rect x="15" y="15" width="220" height="30" fill="white" rx="8" opacity="0.9" stroke="#e2e8f0" stroke-width="1"/>
      <text x="25" y="35" font-family="system-ui, sans-serif" font-size="13" font-weight="bold" fill="#0f172a">THE WATER CYCLE DIAGRAM</text>
    </svg>`;
  }
  
  if (normalized.includes("heart") || normalized.includes("cardiac")) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="100%" height="100%">
      <rect width="600" height="450" fill="#fff5f5" rx="16"/>
      
      <!-- Heart outline and muscle -->
      <path d="M 300 130 C 230 60 140 100 140 190 C 140 280 250 350 300 390 C 350 350 460 280 460 190 C 460 100 370 60 300 130 Z" fill="#e11d48" stroke="#be123c" stroke-width="6"/>
      
      <!-- Left Ventricle cavity inside -->
      <path d="M 300 200 C 270 170 200 200 200 250 C 200 300 270 330 300 360 Z" fill="#9f1239" opacity="0.6"/>
      <!-- Right Ventricle cavity inside -->
      <path d="M 300 200 C 330 170 400 200 400 250 C 400 300 330 330 300 360 Z" fill="#1e3a8a" opacity="0.6"/>

      <!-- Septum divider line -->
      <line x1="300" y1="180" x2="300" y2="380" stroke="#be123c" stroke-width="8" stroke-linecap="round"/>

      <!-- Aorta arch (red arch on top) -->
      <path d="M 280 140 Q 280 60 340 70 Q 380 80 370 140" fill="none" stroke="#e11d48" stroke-width="24" stroke-linecap="round"/>
      <line x1="320" y1="65" x2="320" y2="40" stroke="#e11d48" stroke-width="12"/>
      <line x1="350" y1="70" x2="350" y2="45" stroke="#e11d48" stroke-width="12"/>

      <!-- Vena Cava (blue tube on left) -->
      <rect x="180" y="70" width="20" height="110" rx="6" fill="#2563eb" stroke="#1d4ed8" stroke-width="3"/>
      
      <!-- Labels with pointer dots -->
      <!-- Aorta -->
      <circle cx="340" cy="70" r="4" fill="#1e293b"/>
      <line x1="340" y1="70" x2="450" y2="50" stroke="#1e293b" stroke-width="1.5" stroke-dasharray="3 3"/>
      <text x="460" y="54" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#0f172a">Aorta (Main Artery)</text>

      <!-- Left Atrium -->
      <circle cx="360" cy="180" r="4" fill="#1e293b"/>
      <line x1="360" y1="180" x2="480" y2="160" stroke="#1e293b" stroke-width="1.5" stroke-dasharray="3 3"/>
      <text x="490" y="164" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#0f172a">Left Atrium</text>

      <!-- Right Atrium -->
      <circle cx="230" cy="180" r="4" fill="#1e293b"/>
      <line x1="230" y1="180" x2="80" y2="160" stroke="#1e293b" stroke-width="1.5" stroke-dasharray="3 3"/>
      <text x="15" y="164" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#0f172a">Right Atrium</text>

      <!-- Left Ventricle -->
      <circle cx="350" cy="280" r="4" fill="#1e293b"/>
      <line x1="350" y1="280" x2="480" y2="300" stroke="#1e293b" stroke-width="1.5" stroke-dasharray="3 3"/>
      <text x="490" y="304" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#0f172a">Left Ventricle</text>

      <!-- Right Ventricle -->
      <circle cx="250" cy="280" r="4" fill="#1e293b"/>
      <line x1="250" y1="280" x2="80" y2="300" stroke="#1e293b" stroke-width="1.5" stroke-dasharray="3 3"/>
      <text x="5" y="304" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#0f172a">Right Ventricle</text>

      <!-- Title -->
      <rect x="200" y="15" width="200" height="30" fill="white" rx="8" stroke="#fca5a5" stroke-width="1"/>
      <text x="300" y="35" font-family="system-ui, sans-serif" font-size="13" font-weight="bold" fill="#9f1239" text-anchor="middle">ANATOMY OF THE HEART</text>
    </svg>`;
  }

  if (normalized.includes("cell")) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="100%" height="100%">
      <rect width="600" height="450" fill="#f0fdf4" rx="16"/>
      
      <!-- Cell Wall (Outer Hexagon-like path) -->
      <polygon points="120,80 480,60 520,240 450,380 150,400 80,240" fill="#86efac" stroke="#166534" stroke-width="8" stroke-linejoin="round"/>
      <!-- Cell Membrane (Inner) -->
      <polygon points="128,88 472,69 510,238 442,372 156,391 90,238" fill="#bbf7d0" stroke="#15803d" stroke-width="3" stroke-linejoin="round"/>
      
      <!-- Cytoplasm filling -->
      <polygon points="135,95 465,78 500,235 435,365 162,382 98,235" fill="#f0fdf4"/>

      <!-- Large Central Vacuole (blue blob) -->
      <path d="M 180 180 Q 250 140 350 170 T 400 280 T 250 340 T 150 250 Z" fill="#e0f2fe" stroke="#38bdf8" stroke-width="3"/>
      <text x="250" y="240" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" fill="#0369a1">Central Vacuole</text>

      <!-- Nucleus (Purple circle with nucleolus inside) -->
      <circle cx="410" cy="140" r="45" fill="#f3e8ff" stroke="#7e22ce" stroke-width="3"/>
      <circle cx="420" cy="130" r="18" fill="#c084fc" stroke="#6b21a8" stroke-width="2"/>
      <text x="410" y="175" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" fill="#6b21a8" text-anchor="middle">Nucleus</text>

      <!-- Chloroplasts (Green ovals with lines) -->
      <g transform="translate(140, 110) rotate(15)">
        <ellipse cx="0" cy="0" rx="22" ry="12" fill="#22c55e" stroke="#14532d" stroke-width="2"/>
        <line x1="-15" y1="0" x2="15" y2="0" stroke="#14532d" stroke-width="1.5"/>
      </g>
      <g transform="translate(160, 340) rotate(-30)">
        <ellipse cx="0" cy="0" rx="22" ry="12" fill="#22c55e" stroke="#14532d" stroke-width="2"/>
        <line x1="-15" y1="0" x2="15" y2="0" stroke="#14532d" stroke-width="1.5"/>
      </g>
      <g transform="translate(460, 310) rotate(45)">
        <ellipse cx="0" cy="0" rx="22" ry="12" fill="#22c55e" stroke="#14532d" stroke-width="2"/>
        <line x1="-15" y1="0" x2="15" y2="0" stroke="#14532d" stroke-width="1.5"/>
      </g>

      <!-- Mitochondria (Orange ovals with zigzag) -->
      <g transform="translate(280, 110) rotate(-20)">
        <ellipse cx="0" cy="0" rx="20" ry="10" fill="#f97316" stroke="#7c2d12" stroke-width="2"/>
        <path d="M -15 0 Q -10 5 -5 -3 T 5 5 T 15 -2" fill="none" stroke="#7c2d12" stroke-width="1.5"/>
      </g>
      <g transform="translate(350, 350) rotate(10)">
        <ellipse cx="0" cy="0" rx="20" ry="10" fill="#f97316" stroke="#7c2d12" stroke-width="2"/>
        <path d="M -15 0 Q -10 5 -5 -3 T 5 5 T 15 -2" fill="none" stroke="#7c2d12" stroke-width="1.5"/>
      </g>

      <!-- Labels with lines -->
      <!-- Cell Wall -->
      <circle cx="100" cy="160" r="4" fill="#14532d"/>
      <line x1="100" y1="160" x2="30" y2="130" stroke="#14532d" stroke-width="1.5" stroke-dasharray="3 3"/>
      <text x="25" y="115" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" fill="#14532d">Cell Wall</text>

      <!-- Chloroplast -->
      <circle cx="140" cy="110" r="4" fill="#14532d"/>
      <line x1="140" y1="110" x2="50" y2="70" stroke="#14532d" stroke-width="1.5" stroke-dasharray="3 3"/>
      <text x="45" y="55" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" fill="#14532d">Chloroplast</text>

      <!-- Mitochondrion -->
      <circle cx="280" cy="110" r="4" fill="#7c2d12"/>
      <line x1="280" y1="110" x2="280" y2="40" stroke="#7c2d12" stroke-width="1.5" stroke-dasharray="3 3"/>
      <text x="280" y="30" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" fill="#7c2d12" text-anchor="middle">Mitochondrion</text>

      <!-- Title -->
      <rect x="15" y="15" width="220" height="30" fill="white" rx="8" stroke="#bbf7d0" stroke-width="1"/>
      <text x="25" y="35" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" fill="#166534">PLANT CELL STRUCTURE</text>
    </svg>`;
  }

  if (normalized.includes("atom")) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="100%" height="100%">
      <rect width="600" height="450" fill="#faf5ff" rx="16"/>
      
      <!-- Orbital Shell ellipses -->
      <ellipse cx="300" cy="225" rx="200" ry="80" fill="none" stroke="#a855f7" stroke-width="2" opacity="0.6" transform="rotate(30, 300, 225)"/>
      <ellipse cx="300" cy="225" rx="200" ry="80" fill="none" stroke="#a855f7" stroke-width="2" opacity="0.6" transform="rotate(-30, 300, 225)"/>
      <ellipse cx="300" cy="225" rx="200" ry="80" fill="none" stroke="#a855f7" stroke-width="2" opacity="0.6" transform="rotate(90, 300, 225)"/>

      <!-- Electrons (Blue orbiting balls) -->
      <!-- On Shell 1 (30 deg) -->
      <circle cx="150" cy="140" r="8" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2"/>
      <circle cx="450" cy="310" r="8" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2"/>
      
      <!-- On Shell 2 (-30 deg) -->
      <circle cx="150" cy="310" r="8" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2"/>
      <circle cx="450" cy="140" r="8" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2"/>

      <!-- On Shell 3 (90 deg) -->
      <circle cx="300" cy="45" r="8" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2"/>
      <circle cx="300" cy="405" r="8" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2"/>

      <!-- Nucleus Cluster (Protons & Neutrons) -->
      <g transform="translate(300, 225)">
        <!-- Neutrons (Gray) -->
        <circle cx="-10" cy="-10" r="14" fill="#94a3b8" stroke="#475569" stroke-width="1.5"/>
        <circle cx="12" cy="8" r="14" fill="#94a3b8" stroke="#475569" stroke-width="1.5"/>
        <circle cx="-12" cy="14" r="14" fill="#94a3b8" stroke="#475569" stroke-width="1.5"/>
        
        <!-- Protons (Rose/Red with '+') -->
        <circle cx="8" cy="-12" r="14" fill="#f43f5e" stroke="#be123c" stroke-width="1.5"/>
        <text x="8" y="-3" font-family="system-ui, sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle">+</text>

        <circle cx="-5" cy="5" r="14" fill="#f43f5e" stroke="#be123c" stroke-width="1.5"/>
        <text x="-5" y="14" font-family="system-ui, sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle">+</text>

        <circle cx="14" cy="-3" r="14" fill="#f43f5e" stroke="#be123c" stroke-width="1.5"/>
        <text x="14" y="6" font-family="system-ui, sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle">+</text>
      </g>

      <!-- Labels -->
      <!-- Electron -->
      <line x1="150" y1="140" x2="80" y2="90" stroke="#475569" stroke-width="1.5" stroke-dasharray="3 3"/>
      <text x="75" y="80" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#1d4ed8">Electron (- negative charge)</text>

      <!-- Proton -->
      <line x1="308" y1="213" x2="480" y2="180" stroke="#475569" stroke-width="1.5" stroke-dasharray="3 3"/>
      <text x="490" y="184" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#be123c">Proton (+ positive charge)</text>

      <!-- Neutron -->
      <line x1="312" y1="233" x2="480" y2="270" stroke="#475569" stroke-width="1.5" stroke-dasharray="3 3"/>
      <text x="490" y="274" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#475569">Neutron (Neutral / no charge)</text>

      <!-- Orbital Shell -->
      <line x1="430" y1="200" x2="480" y2="100" stroke="#475569" stroke-width="1.5" stroke-dasharray="3 3"/>
      <text x="490" y="104" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#6b21a8">Electron Orbit / Shell</text>

      <!-- Title -->
      <rect x="200" y="15" width="200" height="30" fill="white" rx="8" stroke="#d8b4fe" stroke-width="1"/>
      <text x="300" y="35" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" fill="#6b21a8" text-anchor="middle">STRUCTURE OF AN ATOM</text>
    </svg>`;
  }

  if (normalized.includes("circuit") || normalized.includes("ohm") || normalized.includes("physics")) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="100%" height="100%">
      <rect width="600" height="450" fill="#f8fafc" rx="16"/>
      
      <!-- Wires / circuit loop outline -->
      <rect x="150" y="100" width="300" height="250" fill="none" stroke="#334155" stroke-width="4"/>

      <!-- Battery on left wire -->
      <g transform="translate(150, 225)">
        <line x1="0" y1="-30" x2="0" y2="30" stroke="#334155" stroke-width="4"/>
        <line x1="-20" y1="-15" x2="20" y2="-15" stroke="#0f172a" stroke-width="6"/>
        <line x1="-10" y1="-5" x2="10" y2="-5" stroke="#0f172a" stroke-width="3"/>
        <line x1="-20" y1="5" x2="20" y2="5" stroke="#0f172a" stroke-width="6"/>
        <line x1="-10" y1="15" x2="10" y2="15" stroke="#0f172a" stroke-width="3"/>
        <text x="30" y="-15" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" fill="#0f172a">+</text>
        <text x="30" y="15" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" fill="#0f172a">-</text>
        <text x="-50" y="5" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#0284c7">Battery (V)</text>
      </g>

      <!-- Resistor on top wire (zigzag) -->
      <g transform="translate(300, 100)">
        <rect x="-40" y="-15" width="80" height="30" fill="#fed7aa" stroke="#ea580c" stroke-width="3" rx="4"/>
        <line x1="-40" y1="0" x2="40" y2="0" stroke="#ea580c" stroke-width="2" stroke-dasharray="8 4"/>
        <text x="0" y="5" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" fill="#ea580c" text-anchor="middle">Resistor (R)</text>
      </g>

      <!-- Switch on bottom wire -->
      <g transform="translate(300, 350)">
        <circle cx="-30" cy="0" r="6" fill="#334155"/>
        <circle cx="30" cy="0" r="6" fill="#334155"/>
        <line x1="-30" y1="0" x2="20" y2="-20" stroke="#334155" stroke-width="4" stroke-linecap="round"/>
        <text x="0" y="25" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#334155" text-anchor="middle">Open Switch</text>
      </g>

      <!-- Ammeter on right wire -->
      <g transform="translate(450, 225)">
        <circle cx="0" cy="0" r="22" fill="#e0f2fe" stroke="#0284c7" stroke-width="3"/>
        <text x="0" y="5" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" fill="#0369a1" text-anchor="middle">A</text>
        <text x="40" y="5" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#0369a1">Ammeter</text>
      </g>

      <!-- Title -->
      <rect x="15" y="15" width="250" height="30" fill="white" rx="8" stroke="#cbd5e1" stroke-width="1"/>
      <text x="25" y="35" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" fill="#1e293b">SCHEMATIC CIRCUIT DIAGRAM</text>
    </svg>`;
  }

  // General concept map/flowchart fallback
  const cleanTitle = (prompt.replace(/[#*`_-]/g, '').trim().substring(0, 35) || "Custom Concept");
  const normalizedLower = cleanTitle.toLowerCase();
  
  const nodes = [
    { id: "1", name: "Core Structure", desc: `Basic structural components of ${cleanTitle}` },
    { id: "2", name: "Primary Function", desc: `The active biological, chemical or physical role` },
    { id: "3", name: "System Mechanism", desc: `How it interacts with surrounding processes` },
    { id: "4", name: "Practical Application", desc: `Real-world experiment or standard exam focus` }
  ];

  if (normalizedLower.includes("photosynthesis")) {
    nodes[0] = { id: "1", name: "Light Absorption", desc: "Chlorophyll absorbs red/blue light energy" };
    nodes[1] = { id: "2", name: "Water Splitting", desc: "Photolysis of H2O releases oxygen gas" };
    nodes[2] = { id: "3", name: "Carbon Fixation", desc: "CO2 is captured in the Calvin cycle" };
    nodes[3] = { id: "4", name: "Glucose Synthesis", desc: "High-energy sugars stored as starch" };
  } else if (normalizedLower.includes("respiration")) {
    nodes[0] = { id: "1", name: "Glycolysis", desc: "Glucose split into pyruvate in cytosol" };
    nodes[1] = { id: "2", name: "Krebs Cycle", desc: "Acetyl-CoA oxidized, releasing CO2" };
    nodes[2] = { id: "3", name: "Electron Transport", desc: "Proton gradient drives ATP synthesis" };
    nodes[3] = { id: "4", name: "Energy Output", desc: "Cells harvest approx 36 ATP molecules" };
  } else if (normalizedLower.includes("atom") || normalizedLower.includes("element") || normalizedLower.includes("structure")) {
    nodes[0] = { id: "1", name: "Protons & Neutrons", desc: "Heavy subatomic particles inside nucleus" };
    nodes[1] = { id: "2", name: "Electron Orbitals", desc: "Negative charge clouds orbiting shell" };
    nodes[2] = { id: "3", name: "Valence Shell", desc: "Outer electrons determining bonding" };
    nodes[3] = { id: "4", name: "Atomic Mass", desc: "Sum of protons/neutrons in nucleus" };
  } else if (normalizedLower.includes("brain") || normalizedLower.includes("nervous")) {
    nodes[0] = { id: "1", name: "Cerebrum", desc: "Handles conscious thought and memory" };
    nodes[1] = { id: "2", name: "Cerebellum", desc: "Coordinates balance and posture" };
    nodes[2] = { id: "3", name: "Brain Stem", desc: "Controls autonomic heart rate & breath" };
    nodes[3] = { id: "4", name: "Neural Pathways", desc: "Transmits impulses via spinal cord" };
  } else if (normalizedLower.includes("volcano") || normalizedLower.includes("earth") || normalizedLower.includes("geography")) {
    nodes[0] = { id: "1", name: "Magma Chamber", desc: "Deep reservoir of molten rock under crust" };
    nodes[1] = { id: "2", name: "Conduit Vent", desc: "Pipe-like shaft carrying lava upwards" };
    nodes[2] = { id: "3", name: "Crater Opening", desc: "Bowl-shaped depression at summit" };
    nodes[3] = { id: "4", name: "Eruption Column", desc: "Searing ash cloud and molten lava flow" };
  } else if (normalizedLower.includes("digestive") || normalizedLower.includes("food") || normalizedLower.includes("stomach")) {
    nodes[0] = { id: "1", name: "Ingestion", desc: "Food broken down by teeth & salivary enzymes" };
    nodes[1] = { id: "2", name: "Digestion", desc: "Acidic breakdown of proteins in stomach" };
    nodes[2] = { id: "3", name: "Absorption", desc: "Nutrient uptake through small intestine villi" };
    nodes[3] = { id: "4", name: "Elimination", desc: "Removal of solid waste via large intestine" };
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 750 520" width="100%" height="100%">
    <defs>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0f172a" flood-opacity="0.05" />
      </filter>
      <marker id="arrow-marker" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#6366f1"/>
      </marker>
      <linearGradient id="central-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#e0e7ff"/>
        <stop offset="100%" stop-color="#e0f2fe"/>
      </linearGradient>
    </defs>

    <!-- Canvas Background -->
    <rect width="100%" height="100%" fill="#f8fafc" rx="16"/>
    
    <!-- Connection lines -->
    <path d="M 180 140 L 290 220" fill="none" stroke="#94a3b8" stroke-width="2.5" marker-end="url(#arrow-marker)"/>
    <path d="M 570 140 L 460 220" fill="none" stroke="#94a3b8" stroke-width="2.5" marker-end="url(#arrow-marker)"/>
    <path d="M 375 300 L 180 380" fill="none" stroke="#94a3b8" stroke-width="2.5" marker-end="url(#arrow-marker)"/>
    <path d="M 375 300 L 570 380" fill="none" stroke="#94a3b8" stroke-width="2.5" marker-end="url(#arrow-marker)"/>

    <!-- Central Topic card -->
    <rect x="225" y="210" width="300" height="100" rx="20" fill="url(#central-bg)" stroke="#4f46e5" stroke-width="3.5" filter="url(#shadow)" />
    <text x="375" y="255" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="900" fill="#1e1b4b" text-anchor="middle" letter-spacing="-0.5px">${cleanTitle.toUpperCase()}</text>
    <text x="375" y="278" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="extrabold" fill="#4f46e5" text-anchor="middle" letter-spacing="1.5px">DYNAMIC ACADEMIC STUDY DIAGRAM</text>

    <!-- Node 1 (Top Left) -->
    <rect x="30" y="80" width="200" height="76" rx="14" fill="#f0fdf4" stroke="#22c55e" stroke-width="2" filter="url(#shadow)"/>
    <text x="130" y="110" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="900" fill="#14532d" text-anchor="middle">${nodes[0].name}</text>
    <text x="130" y="128" font-family="system-ui, -apple-system, sans-serif" font-size="8.5" fill="#166534" text-anchor="middle">${nodes[0].desc}</text>

    <!-- Node 2 (Top Right) -->
    <rect x="520" y="80" width="200" height="76" rx="14" fill="#eff6ff" stroke="#3b82f6" stroke-width="2" filter="url(#shadow)"/>
    <text x="620" y="110" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="900" fill="#1e3a8a" text-anchor="middle">${nodes[1].name}</text>
    <text x="620" y="128" font-family="system-ui, -apple-system, sans-serif" font-size="8.5" fill="#1e40af" text-anchor="middle">${nodes[1].desc}</text>

    <!-- Node 3 (Bottom Left) -->
    <rect x="30" y="360" width="200" height="76" rx="14" fill="#fff7ed" stroke="#f97316" stroke-width="2" filter="url(#shadow)"/>
    <text x="130" y="390" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="900" fill="#7c2d12" text-anchor="middle">${nodes[2].name}</text>
    <text x="130" y="408" font-family="system-ui, -apple-system, sans-serif" font-size="8.5" fill="#9a3412" text-anchor="middle">${nodes[2].desc}</text>

    <!-- Node 4 (Bottom Right) -->
    <rect x="520" y="360" width="200" height="76" rx="14" fill="#fdf2f8" stroke="#ec4899" stroke-width="2" filter="url(#shadow)"/>
    <text x="620" y="390" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="900" fill="#831843" text-anchor="middle">${nodes[3].name}</text>
    <text x="620" y="408" font-family="system-ui, -apple-system, sans-serif" font-size="8.5" fill="#9d174d" text-anchor="middle">${nodes[3].desc}</text>

    <!-- Title Card -->
    <g id="title-card">
      <rect x="25" y="22" width="700" height="42" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" rx="10" filter="url(#shadow)"/>
      <text x="45" y="48" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="950" fill="#0f172a" letter-spacing="-0.5px">${cleanTitle.toUpperCase()}</text>
      <rect x="585" y="31" width="125" height="24" rx="6" fill="#f1f5f9" />
      <text x="647" y="46" font-family="system-ui, sans-serif" font-size="8.5" font-weight="extrabold" fill="#475569" text-anchor="middle">🛡️ OFFLINE SAFE</text>
    </g>
  </svg>`;
}

// Helper color function for the dynamic SVG Diagram Generator
function getNodeColors(colorName: string, theme: string) {
  const defaultColors = {
    fill: "#ffffff",
    stroke: "#94a3b8",
    title: "#334155",
    desc: "#64748b"
  };

  const palettes: Record<string, Record<string, { fill: string; stroke: string; title: string; desc: string }>> = {
    textbook: {
      indigo: { fill: "#f0f2fe", stroke: "#6366f1", title: "#312e81", desc: "#4338ca" },
      emerald: { fill: "#ecfdf5", stroke: "#10b981", title: "#064e3b", desc: "#047857" },
      amber: { fill: "#fffbeb", stroke: "#f59e0b", title: "#78350f", desc: "#b45309" },
      sky: { fill: "#f0f9ff", stroke: "#0ea5e9", title: "#0c4a6e", desc: "#0369a1" },
      rose: { fill: "#fff1f2", stroke: "#f43f5e", title: "#4c0519", desc: "#be123c" },
      violet: { fill: "#faf5ff", stroke: "#a855f7", title: "#3b0764", desc: "#7e22ce" },
      teal: { fill: "#f0fdfa", stroke: "#14b8a6", title: "#115e59", desc: "#0f766e" },
    },
    blueprint: {
      indigo: { fill: "#0a1d37", stroke: "#4f46e5", title: "#ffffff", desc: "#93c5fd" },
      emerald: { fill: "#0a261f", stroke: "#10b981", title: "#ffffff", desc: "#86efac" },
      amber: { fill: "#211a0d", stroke: "#f59e0b", title: "#ffffff", desc: "#fde047" },
      sky: { fill: "#051f33", stroke: "#0ea5e9", title: "#ffffff", desc: "#7dd3fc" },
      rose: { fill: "#290c12", stroke: "#f43f5e", title: "#ffffff", desc: "#fda4af" },
      violet: { fill: "#1a0b2e", stroke: "#a855f7", title: "#ffffff", desc: "#d8b4fe" },
      teal: { fill: "#05221e", stroke: "#14b8a6", title: "#ffffff", desc: "#99f6e4" },
    },
    chalkboard: {
      indigo: { fill: "rgba(255,255,255,0.05)", stroke: "#a5b4fc", title: "#e0e7ff", desc: "#c7d2fe" },
      emerald: { fill: "rgba(255,255,255,0.05)", stroke: "#6ee7b7", title: "#ecfdf5", desc: "#a7f3d0" },
      amber: { fill: "rgba(255,255,255,0.05)", stroke: "#fde047", title: "#fef9c3", desc: "#fef08a" },
      sky: { fill: "rgba(255,255,255,0.05)", stroke: "#7dd3fc", title: "#e0f2fe", desc: "#bae6fd" },
      rose: { fill: "rgba(255,255,255,0.05)", stroke: "#fca5a5", title: "#ffe4e6", desc: "#fecdd3" },
      violet: { fill: "rgba(255,255,255,0.05)", stroke: "#d8b4fe", title: "#faf5ff", desc: "#e9d5ff" },
      teal: { fill: "rgba(255,255,255,0.05)", stroke: "#99f6e4", title: "#f0fdfa", desc: "#ccfbf1" },
    },
    pencil: {
      indigo: { fill: "#ffffff", stroke: "#1e293b", title: "#1e293b", desc: "#475569" },
      emerald: { fill: "#ffffff", stroke: "#1e293b", title: "#1e293b", desc: "#475569" },
      amber: { fill: "#ffffff", stroke: "#1e293b", title: "#1e293b", desc: "#475569" },
      sky: { fill: "#ffffff", stroke: "#1e293b", title: "#1e293b", desc: "#475569" },
      rose: { fill: "#ffffff", stroke: "#1e293b", title: "#1e293b", desc: "#475569" },
      violet: { fill: "#ffffff", stroke: "#1e293b", title: "#1e293b", desc: "#475569" },
      teal: { fill: "#ffffff", stroke: "#1e293b", title: "#1e293b", desc: "#475569" },
    },
    infographic: {
      indigo: { fill: "#ffffff", stroke: "#6366f1", title: "#312e81", desc: "#4f46e5" },
      emerald: { fill: "#ffffff", stroke: "#10b981", title: "#064e3b", desc: "#10b981" },
      amber: { fill: "#ffffff", stroke: "#f59e0b", title: "#78350f", desc: "#d97706" },
      sky: { fill: "#ffffff", stroke: "#0ea5e9", title: "#0c4a6e", desc: "#0284c7" },
      rose: { fill: "#ffffff", stroke: "#f43f5e", title: "#4c0519", desc: "#e11d48" },
      violet: { fill: "#ffffff", stroke: "#a855f7", title: "#3b0764", desc: "#9333ea" },
      teal: { fill: "#ffffff", stroke: "#14b8a6", title: "#115e59", desc: "#0d9488" },
    }
  };

  const themePalette = palettes[theme] || palettes.textbook;
  return themePalette[colorName] || themePalette.indigo || defaultColors;
}

// Highly polished responsive vector SVG builder from structured educational JSON
function buildSvgFromDiagramData(data: any, style: string, isPracticeMode: boolean): string {
  const title = data.title || "Study Diagram";
  const subtitle = data.subtitle || "Concept Map";
  const nodes = data.nodes || [];
  const connections = data.connections || [];
  const totalNodes = nodes.length;
  const layout = data.layout || "central";

  // Position nodes based on selected layout
  nodes.forEach((node: any, idx: number) => {
    if (layout === "cycle") {
      const angle = (idx / totalNodes) * 2 * Math.PI - Math.PI / 2;
      node.x = 375 + Math.cos(angle) * 220;
      node.y = 275 + Math.sin(angle) * 125;
    } else if (layout === "flow") {
      const colSpacing = 650 / (totalNodes || 1);
      node.x = 50 + (idx * colSpacing) + (colSpacing / 2);
      node.y = 275 + (idx % 2 === 0 ? -60 : 60);
    } else if (layout === "hierarchy") {
      if (idx === 0) {
        node.x = 375;
        node.y = 130;
      } else {
        const remainingCount = totalNodes - 1;
        const colSpacing = 650 / (remainingCount || 1);
        node.x = 50 + ((idx - 1) * colSpacing) + (colSpacing / 2);
        node.y = 370;
      }
    } else if (layout === "split") {
      const half = Math.ceil(totalNodes / 2);
      if (idx < half) {
        const rowSpacing = 320 / (half || 1);
        node.x = 180;
        node.y = 140 + idx * rowSpacing + rowSpacing / 2;
      } else {
        const rightIdx = idx - half;
        const rightCount = totalNodes - half;
        const rowSpacing = 320 / (rightCount || 1);
        node.x = 570;
        node.y = 140 + rightIdx * rowSpacing + rowSpacing / 2;
      }
    } else {
      // Central (Mindmap)
      if (idx === 0) {
        node.x = 375;
        node.y = 275;
      } else {
        const remainingCount = totalNodes - 1;
        const angle = ((idx - 1) / remainingCount) * 2 * Math.PI;
        node.x = 375 + Math.cos(angle) * 220;
        node.y = 275 + Math.sin(angle) * 125;
      }
    }
  });

  // Theme styling configurations
  let bgFill = "#f8fafc";
  let titleColor = "#0f172a";
  let subtitleColor = "#475569";
  let gridLines = "";
  let lineColor = "#64748b";
  let lineDash = "";
  let cardShadow = 'filter="url(#shadow)"';
  let cardRx = "14";
  let arrowFill = "#64748b";

  if (style === "blueprint") {
    bgFill = "#0a132b";
    titleColor = "#00e5ff";
    subtitleColor = "#8ecae6";
    lineColor = "#00b4d8";
    arrowFill = "#00b4d8";
    cardShadow = "";
    cardRx = "4";
    gridLines = `
      <defs>
        <pattern id="blueprint-grid" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1c2541" stroke-width="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#blueprint-grid)" rx="16" />
    `;
  } else if (style === "chalkboard") {
    bgFill = "#0f1d13";
    titleColor = "#fef9c3";
    subtitleColor = "#cbd5e1";
    lineColor = "#a7f3d0";
    arrowFill = "#a7f3d0";
    cardShadow = "";
    cardRx = "8";
    lineDash = 'stroke-dasharray="4 4"';
    gridLines = `
      <path d="M 20 40 Q 300 15 700 40" fill="none" stroke="rgba(255,255,255,0.02)" stroke-width="2"/>
      <path d="M 50 480 Q 400 450 720 470" fill="none" stroke="rgba(255,255,255,0.01)" stroke-width="1.5"/>
    `;
  } else if (style === "pencil") {
    bgFill = "#ffffff";
    titleColor = "#1e293b";
    subtitleColor = "#475569";
    lineColor = "#1e293b";
    arrowFill = "#1e293b";
    cardShadow = "";
    cardRx = "0";
  } else if (style === "infographic") {
    bgFill = "url(#info-bg)";
    titleColor = "#1e1b4b";
    subtitleColor = "#4338ca";
    lineColor = "#cbd5e1";
    arrowFill = "#cbd5e1";
    gridLines = `
      <defs>
        <linearGradient id="info-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#faf5ff"/>
          <stop offset="100%" stop-color="#eff6ff"/>
        </linearGradient>
      </defs>
    `;
  }

  let svgHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 750 520" width="100%" height="100%">
    <defs>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0f172a" flood-opacity="0.05" />
      </filter>
      <marker id="arrow-marker" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="${arrowFill}"/>
      </marker>
    </defs>

    <!-- Canvas Background -->
    <rect width="100%" height="100%" fill="${bgFill}" rx="16"/>
    ${gridLines}

    <!-- Connection Lines / Arrows -->
    <g id="connections">
  `;

  connections.forEach((conn: any) => {
    const fromNode = nodes.find((n: any) => String(n.id) === String(conn.from));
    const toNode = nodes.find((n: any) => String(n.id) === String(conn.to));
    if (fromNode && toNode) {
      const dx = toNode.x - fromNode.x;
      const dy = toNode.y - fromNode.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      
      const ratioStart = 50 / dist;
      const ratioEnd = 58 / dist;
      
      const startX = fromNode.x + dx * ratioStart;
      const startY = fromNode.y + dy * ratioStart;
      const endX = toNode.x - dx * ratioEnd;
      const endY = toNode.y - dy * ratioEnd;

      svgHtml += `
        <path d="M ${startX} ${startY} L ${endX} ${endY}" fill="none" stroke="${lineColor}" stroke-width="2" ${lineDash} marker-end="url(#arrow-marker)"/>
      `;

      if (conn.label) {
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        const pillBg = style === "blueprint" ? "#1c2541" : style === "chalkboard" ? "#1e293b" : "#ffffff";
        const pillText = style === "blueprint" ? "#8ecae6" : style === "chalkboard" ? "#a7f3d0" : "#475569";
        const pillBorder = style === "blueprint" ? "#00b4d8" : style === "chalkboard" ? "none" : "#e2e8f0";
        svgHtml += `
          <g>
            <rect x="${midX - 60}" y="${midY - 10}" width="120" height="20" rx="4" fill="${pillBg}" stroke="${pillBorder}" stroke-width="0.5"/>
            <text x="${midX}" y="${midY + 4}" font-family="system-ui, sans-serif" font-size="9" fill="${pillText}" text-anchor="middle" font-weight="bold">${conn.label}</text>
          </g>
        `;
      }
    }
  });

  svgHtml += `</g>\n<g id="nodes">`;

  // Draw Node Cards
  nodes.forEach((node: any, idx: number) => {
    const colors = getNodeColors(node.color || "indigo", style);
    const cardW = 166;
    const cardH = 76;
    const rx = node.x - cardW / 2;
    const ry = node.y - cardH / 2;

    svgHtml += `
      <!-- Node Card ${node.id} -->
      <g id="node-${node.id}">
        <rect x="${rx}" y="${ry}" width="${cardW}" height="${cardH}" rx="${cardRx}" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="2" ${cardShadow}/>
    `;

    if (style === "infographic") {
      svgHtml += `
        <rect x="${rx}" y="${ry}" width="6" height="${cardH}" rx="3" fill="${colors.stroke}" />
      `;
    }

    if (isPracticeMode) {
      const badgeR = 14;
      const badgeY = ry + 24;
      svgHtml += `
        <!-- Self-Test Blank Badge -->
        <circle cx="${node.x}" cy="${badgeY}" r="${badgeR}" fill="${colors.stroke}" />
        <text x="${node.x}" y="${badgeY + 4}" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="extrabold" fill="#ffffff" text-anchor="middle">${idx + 1}</text>
        
        <!-- Part Description -->
        <text x="${node.x}" y="${ry + 54}" font-family="system-ui, -apple-system, sans-serif" font-size="8.5" fill="${colors.desc}" text-anchor="middle" font-weight="medium">${node.description || "Identify this component"}</text>
      `;
    } else {
      let displayName = node.name || "Component";
      if (displayName.length > 22) {
        displayName = displayName.substring(0, 20) + "...";
      }
      
      let descLine1 = node.description || "";
      let descLine2 = "";
      if (descLine1.length > 32) {
        const words = descLine1.split(" ");
        let buildLine = "";
        let breakIndex = 0;
        for (let i = 0; i < words.length; i++) {
          if ((buildLine + " " + words[i]).length > 30) {
            breakIndex = i;
            break;
          }
          buildLine += (i === 0 ? "" : " ") + words[i];
        }
        descLine1 = buildLine;
        descLine2 = words.slice(breakIndex).join(" ");
        if (descLine2.length > 32) {
          descLine2 = descLine2.substring(0, 29) + "...";
        }
      }

      svgHtml += `
        <!-- Part Name -->
        <text x="${node.x}" y="${ry + 26}" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="extrabold" fill="${colors.title}" text-anchor="middle">${displayName}</text>
        
        <!-- Part Description Line 1 -->
        <text x="${node.x}" y="${ry + 44}" font-family="system-ui, -apple-system, sans-serif" font-size="8.5" fill="${colors.desc}" text-anchor="middle">${descLine1}</text>
      `;

      if (descLine2) {
        svgHtml += `
          <!-- Part Description Line 2 -->
          <text x="${node.x}" y="${ry + 56}" font-family="system-ui, -apple-system, sans-serif" font-size="8.5" fill="${colors.desc}" text-anchor="middle">${descLine2}</text>
        `;
      }
    }

    svgHtml += `</g>`;
  });

  // Header Title card at the top
  const titleBg = style === "blueprint" ? "#101b35" : style === "chalkboard" ? "#0f1d13" : "#ffffff";
  const titleBorder = style === "blueprint" ? "#00b4d8" : style === "chalkboard" ? "#a7f3d0" : "#e2e8f0";
  const titleBorderW = style === "chalkboard" ? "0" : "1";

  svgHtml += `
    </g>
    
    <!-- Title Card -->
    <g id="title-card">
      <rect x="25" y="22" width="700" height="52" fill="${titleBg}" stroke="${titleBorder}" stroke-width="${titleBorderW}" rx="10" ${cardShadow}/>
      <text x="50" y="44" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="900" fill="${titleColor}" letter-spacing="-0.5px">${title.toUpperCase()}</text>
      <text x="50" y="61" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="bold" fill="${subtitleColor}" opacity="0.85">${subtitle.toUpperCase()}</text>
  `;

  if (isPracticeMode) {
    svgHtml += `
      <rect x="525" y="32" width="175" height="30" rx="6" fill="#e11d48" />
      <text x="612" y="50" font-family="system-ui, sans-serif" font-size="10" font-weight="extrabold" fill="#ffffff" text-anchor="middle">🧠 SELF-TEST ACTIVE</text>
    `;
  } else {
    const badgeText = `🎨 ${style.toUpperCase()} VIEW`;
    const badgeFill = style === "blueprint" ? "#003566" : style === "chalkboard" ? "#143a22" : "#f1f5f9";
    const badgeTextCol = style === "blueprint" ? "#00f5ff" : style === "chalkboard" ? "#a7f3d0" : "#475569";
    svgHtml += `
      <rect x="575" y="32" width="125" height="30" rx="6" fill="${badgeFill}" />
      <text x="637" y="50" font-family="system-ui, sans-serif" font-size="9" font-weight="extrabold" fill="${badgeTextCol}" text-anchor="middle">${badgeText}</text>
    `;
  }

  svgHtml += `
    </g>
  </svg>`;

  return svgHtml;
}

app.post("/api/gemini/diagram", async (req, res) => {
  const { prompt } = req.body;
  const promptLower = (prompt || "").toLowerCase();

  // Determine design style and practice mode parameters
  let selectedStyle = "textbook";
  if (promptLower.includes("blueprint")) {
    selectedStyle = "blueprint";
  } else if (promptLower.includes("chalkboard")) {
    selectedStyle = "chalkboard";
  } else if (promptLower.includes("pencil")) {
    selectedStyle = "pencil";
  } else if (promptLower.includes("infographic")) {
    selectedStyle = "infographic";
  }

  const isPracticeMode = promptLower.includes("blank self-test practice") || 
                         promptLower.includes("①") || 
                         promptLower.includes("practice mode");

  // 1. Primary path: Generate structured JSON data and render beautifully as high-fidelity SVG (Fast & quota-safe!)
  try {
    const ai = getGeminiClient();
    const jsonPrompt = `You are an expert academic illustrator and curriculum designer.
    Analyze the following topic and create a comprehensive, clean, structured educational conceptual diagram: "${prompt}".
    
    Generate a JSON response that breaks down this diagram into specific nodes (labeled parts) and connections (flows/cycles/relationships) that are highly educational.
    
    Return ONLY valid JSON with the following structure:
    {
      "title": "Clear, concise academic title of the diagram",
      "subtitle": "Brief subtitle explaining the visual structure",
      "layout": "cycle" | "flow" | "central" | "hierarchy" | "split",
      "nodes": [
        {
          "id": "1",
          "name": "Name of part/step (e.g. Evaporation, Mitochondria, Crust)",
          "description": "Short, clear 1-sentence educational purpose or definition of this component",
          "color": "indigo" | "emerald" | "amber" | "sky" | "rose" | "violet" | "teal"
        }
      ],
      "connections": [
        {
          "from": "node_id_1",
          "to": "node_id_2",
          "label": "Action/flow description (e.g. 'Heated by sun', 'Synthesizes ATP')"
        }
      ]
    }
    
    Rules:
    - Use "cycle" layout for repeating circular processes (e.g. water cycles, life cycles).
    - Use "flow" layout for sequential step-by-step processes, pathways, or timelines.
    - Use "central" or "hierarchy" layout for structural components or parts listing.
    - Keep descriptions clear, concise, and highly informative.`;

    const jsonResponse = await callGeminiWithRetryAndFailover(ai, {
      model: "gemini-3.5-flash", 
      contents: jsonPrompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    let rawText = jsonResponse.text || "";
    // Strip markdown wrapper if present
    rawText = rawText.trim();
    if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "").trim();
    }

    const data = JSON.parse(rawText);
    if (data && data.nodes && data.nodes.length > 0) {
      const svgCode = buildSvgFromDiagramData(data, selectedStyle, isPracticeMode);
      const base64Svg = Buffer.from(svgCode).toString("base64");
      const imageUrl = `data:image/svg+xml;base64,${base64Svg}`;
      return res.json({ imageUrl, isSvg: true });
    } else {
      throw new Error("Parsed JSON did not contain valid diagram nodes.");
    }
  } catch (err: any) {
    console.warn("[Gemini Bridge] Primary JSON Diagram path failed or rate-limited. Trying standard text-to-SVG direct fallback...", err.message || err);
    
    // 2. Secondary fallback: Generate standalone raw SVG code using alternative fallback models
    try {
      const ai = getGeminiClient();
      const svgPrompt = `You are an expert educational designer. Create a beautiful, detailed, neat, textbook-grade academic vector SVG diagram/illustration for: "${prompt}".
      
      Requirements:
      1. MUST be a valid, standalone <svg> element with viewBox="0 0 600 450" and width="100%" height="100%".
      2. Use a modern, ultra-clean design: soft background, precise vector shapes (rects, circles, paths), elegant colors (indigo, slate, sky, emerald), and clear, clean leader lines/arrows pointing to labels.
      3. Include prominent, highly readable, clear textbook labels for all major parts of the diagram using <text> elements (font-family="system-ui, -apple-system, sans-serif" and proper sizing/contrast).
      4. Make it highly detailed, professional, and visually appealing.
      5. Output ONLY the raw SVG code. No markdown formatting (like \`\`\`xml or \`\`\`svg), no leading/trailing commentary, no explanations. It must start with <svg and end with </svg>.`;

      const svgResponse = await callGeminiWithRetryAndFailover(ai, {
        model: "gemini-3.1-flash-lite",
        contents: svgPrompt,
      });

      let svgCode = svgResponse.text || "";
      svgCode = svgCode.trim();
      if (svgCode.startsWith("```")) {
        svgCode = svgCode.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "").trim();
      }

      if (svgCode.includes("<svg")) {
        const base64Svg = Buffer.from(svgCode).toString("base64");
        const imageUrl = `data:image/svg+xml;base64,${base64Svg}`;
        return res.json({ imageUrl, isSvg: true });
      } else {
        throw new Error("Raw SVG fallback did not produce a valid svg tag.");
      }
    } catch (svgErr: any) {
      console.warn("[Gemini Bridge] SVG fallback also failed. Trying standard image model fallback...", svgErr.message || svgErr);
      
      // 3. Tertiary fallback: Try generating an image using Gemini's image models
      try {
        const ai = getGeminiClient();
        const response = await callGeminiWithRetryAndFailover(ai, {
          model: "gemini-3.1-flash-lite-image",
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
        
        if (imageUrl) {
          return res.json({ imageUrl, isSvg: false });
        } else {
          throw new Error("No inline data returned from fallback image model.");
        }
      } catch (imgErr: any) {
        console.warn("[Gemini Bridge] Image fallback failed. Generating guaranteed local SVG template...", imgErr.message || imgErr);
      }
    }
  }

  // 4. Guaranteed quaternary local fallback: generate local hand-crafted SVG built by code
  try {
    const fallbackSvg = generateGuaranteedLocalSvg(prompt);
    const base64Svg = Buffer.from(fallbackSvg).toString("base64");
    res.json({ imageUrl: `data:image/svg+xml;base64,${base64Svg}`, isSvg: true });
  } catch (localErr: any) {
    console.error("[Gemini Bridge] Guaranteed local fallback SVG conversion failed:", localErr.message || localErr);
    res.status(500).json({ error: "Failed to generate any diagram." });
  }
});

app.post("/api/gemini/notes-generator", async (req, res) => {
  const { topic, subject, grade = "10" } = req.body;
  try {
    const prompt = `Generate comprehensive, highly educational, structured study notes on the topic: "${topic}" for Subject: "${subject}" at a Grade ${grade} level. 
    Format with clean Markdown, clear headings, bullet points, key definitions, and examples.
    Return ONLY valid JSON in the format: {"title": "...", "content": "..."}`;
    
    const ai = getGeminiClient();
    const response = await callGeminiWithRetryAndFailover(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (err: any) {
    console.warn("Notes generator error:", err);
    handleRouteError(res, err);
    res.json({ 
      title: `${topic} Notes`, 
      content: `### ${topic}\n\nNotes could not be generated dynamically due to a network error. Here is a brief outline of ${topic} for ${subject}.\n\n- Key Concept 1: Definition and details\n- Key Concept 2: Mathematical or practical applications\n- Important Formula/Fact: Standard references.` 
    });
  }
});

app.post("/api/gemini/notes-summarizer", async (req, res) => {
  const { content } = req.body;
  try {
    const prompt = `Create a concise, high-impact summary of the following study notes. Highlight key terms, major formulas, and critical takeaways using bullet points. Keep it clear and easy for a student to review quickly.\n\nNotes Content:\n${content}`;
    
    const ai = getGeminiClient();
    const response = await callGeminiWithRetryAndFailover(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
    });
    res.json({ summary: response.text });
  } catch (err: any) {
    console.warn("Notes summarizer error:", err);
    handleRouteError(res, err);
    res.json({ summary: "Failed to summarize notes dynamically due to a service error. Please try again." });
  }
});

app.post("/api/gemini/explain-topic", async (req, res) => {
  const { topic, subject, grade = "10", style = "Simple" } = req.body;
  try {
    let styleInstruction = "Explain in extremely simple, friendly language suitable for a child.";
    if (style === "Analogies") {
      styleInstruction = "Explain using vivid, funny everyday analogies and metaphors that makes it impossible to forget.";
    } else if (style === "5-year-old") {
      styleInstruction = "Explain like I am 5 years old (ELI5). Use very basic words and a fun, story-like approach.";
    } else if (style === "Step-by-step") {
      styleInstruction = "Provide a meticulous, clear step-by-step breakdown from first principles.";
    }
    
    const prompt = `${styleInstruction} Topic: "${topic}" (Subject: ${subject}) for Grade ${grade}. Make it engaging and encouraging!`;
    const ai = getGeminiClient();
    const response = await callGeminiWithRetryAndFailover(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
    });
    res.json({ explanation: response.text });
  } catch (err: any) {
    console.warn("Explain topic error:", err);
    handleRouteError(res, err);
    res.json({ explanation: "Could not fetch a simplified explanation at this moment. Please check your internet connection and try again." });
  }
});

app.post("/api/gemini/mindmap", async (req, res) => {
  const { topic } = req.body;
  try {
    const prompt = `Generate a hierarchical mind map structure for the topic: "${topic}".
    Provide a deeply nested JSON representation where each node has a "name" and an optional list of "children" (which is an array of other nodes). Limit hierarchy depth to 3 levels.
    Format your response ONLY as valid JSON in this exact structure:
    {"name": "${topic}", "children": [{"name": "Subtopic A", "children": [{"name": "Detail 1"}]}, {"name": "Subtopic B", "children": []}]}`;
    
    const ai = getGeminiClient();
    const response = await callGeminiWithRetryAndFailover(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (err: any) {
    console.warn("Mindmap error:", err);
    handleRouteError(res, err);
    res.json({
      name: topic,
      children: [
        { name: "Overview & Definitions", children: [{ name: "Core terms" }, { name: "Basic ideas" }] },
        { name: "Key Formulas & Rules", children: [{ name: "Standard applications" }] },
        { name: "Examples", children: [] }
      ]
    });
  }
});

app.post("/api/gemini/question-paper", async (req, res) => {
  const { topic, subject, grade = "10" } = req.body;
  try {
    const prompt = `Create a complete, formal, school-grade question paper for the topic: "${topic}" in Subject: "${subject}" for Grade ${grade} students.
    Divide the paper into:
    - Section A: 5 Multiple Choice Questions (with correct options indicated at the very bottom in an answer key)
    - Section B: 3 Short Answer Questions (each with marks allotted, e.g., [3 Marks])
    - Section C: 2 Long Answer/Analytical Questions (each with marks allotted, e.g., [5 Marks])
    Format beautifully with clean Markdown headings and lines.`;
    
    const ai = getGeminiClient();
    const response = await callGeminiWithRetryAndFailover(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
    });
    res.json({ paperText: response.text });
  } catch (err: any) {
    console.warn("Question paper error:", err);
    handleRouteError(res, err);
    res.json({ paperText: "Failed to generate question paper dynamically. Please try again." });
  }
});

app.post("/api/gemini/ocr", async (req, res) => {
  const { imageBase64 } = req.body;
  try {
    if (!imageBase64) {
      return res.status(400).json({ error: "Missing imageBase64 data" });
    }
    const cleanBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
    
    const ai = getGeminiClient();
    const response = await callGeminiWithRetryAndFailover(ai, {
      model: "gemini-3.5-flash",
      contents: [
        { text: "Extract all study-related text, math equations, formulas, and written contents from this image. Return clean text formatted properly. If there are math equations, format them nicely." },
        {
          inlineData: {
            mimeType: "image/png",
            data: cleanBase64
          }
        }
      ],
    });
    res.json({ text: response.text });
  } catch (err: any) {
    console.warn("OCR error:", err);
    handleRouteError(res, err);
    res.status(500).json({ error: "Failed to extract text from image." });
  }
});

app.post("/api/gemini/pdf-summary", async (req, res) => {
  const { textContent } = req.body;
  try {
    const prompt = `Analyze the following document text and produce a structured analysis.
    Return a JSON object containing:
    1. "summary": A concise overview of the document (Markdown-enabled string).
    2. "keyTerms": An array of objects: [{"term": "...", "definition": "..."}].
    3. "questions": An array of mock test questions: [{"question": "...", "options": ["...", "...", "...", "..."], "answer": 0}].
    Limit key terms to 5 and questions to 5.
    
    Document text:
    ${textContent.substring(0, 8000)}`;
    
    const ai = getGeminiClient();
    const response = await callGeminiWithRetryAndFailover(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (err: any) {
    console.warn("PDF Summary error:", err);
    handleRouteError(res, err);
    res.json({
      summary: "Could not summarize document dynamically. Pasted content is too long or server is busy.",
      keyTerms: [],
      questions: []
    });
  }
});

app.post("/api/gemini/quiz", async (req, res) => {
  const { subject, studentContext, language, difficulty } = req.body;
  const quizLang = language || "English";
  const quizDiff = difficulty || "Medium";
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
    } else if (quizLang === "Russian") {
      languageInstruct = "entirely in clean, simple Russian language suitable for school students.";
    } else if (quizLang === "Chinese") {
      languageInstruct = "entirely in clean, simple Chinese (Simplified) language suitable for school students.";
    } else {
      languageInstruct = "entirely in simple, school-grade English.";
    }

    let syllabusInstruct = "";
    if (studentContext) {
      const country = studentContext.country || "Global";
      if (country === "Russia") {
        syllabusInstruct = "strictly following the Russian National Educational Syllabus (Государственная программа / ФГОС) standard,";
      } else if (country === "China") {
        syllabusInstruct = "strictly matching the Chinese National Curriculum Standard (国家课程标准) standard,";
      } else if (country === "United States") {
        syllabusInstruct = "aligned with US Common Core / NGSS standards,";
      } else if (country === "India") {
        syllabusInstruct = "aligned with Indian CBSE (NCERT) syllabus guidelines,";
      } else if (country === "United Kingdom") {
        syllabusInstruct = "aligned with GCSE / National Curriculum of England standards,";
      }
    }

    let difficultyInstruct = "";
    if (quizDiff === "Easy") {
      difficultyInstruct = "The difficulty of the quiz MUST be EASY. Focus on introductory definitions, basic concepts, and direct, straightforward questions. Keep option choices distinct and simple.";
    } else if (quizDiff === "Hard") {
      difficultyInstruct = "The difficulty of the quiz MUST be HARD or ADVANCED. Focus on complex, multi-step problem solving, critical thinking, advanced theories, and subtle nuances. Use trickier, highly plausible options/distractors to challenge the student.";
    } else {
      difficultyInstruct = "The difficulty of the quiz MUST be MEDIUM. Provide a balanced mix of conceptual recall, analytical questions, and practical applications suitable for typical classroom standards.";
    }

    const instructionText = `Generate a 5-question multiple choice quiz ${classText} ${syllabusInstruct} for ${subject} ${languageInstruct} ${difficultyInstruct} Return only valid JSON in the format: [{"question": "...", "options": ["...", "...", "...", "..."], "answer": 0}]`;

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
    handleRouteError(res, err);
    const languageKey = (quizLang === "Hindi" ? "Hindi" : "English") as "Hindi" | "English";
    const fallbackSet = FALLBACK_QUIZZES[subject]?.[languageKey] || FALLBACK_QUIZZES[subject]?.["English"] || [];
    res.json(fallbackSet);
  }
});

const flashcardsMemoryCache = new Map<string, any>();

app.post("/api/gemini/flashcard", async (req, res) => {
  const { subject, noteTitle, noteContent, count = 5 } = req.body;
  
  // 1. Check Server Memory Cache
  const cacheKey = `${subject}_${noteTitle || ""}_${noteContent || ""}_${count}`;
  if (flashcardsMemoryCache.has(cacheKey)) {
    console.log(`[Cache Hit - Server] Returning flashcards for: ${cacheKey}`);
    return res.json(flashcardsMemoryCache.get(cacheKey));
  }

  try {
    const contextText = noteContent 
      ? `based on this study note titled "${noteTitle || 'Untitled'}" with content: "${noteContent}"`
      : `for general study of the subject "${subject}"`;

    const ai = getGeminiClient();
    let finalCards: Array<{ front: string; back: string }> = [];

    // 2. Batching / Optimization Strategy
    // For larger counts (e.g., 10), we split into 2 parallel batches of 5 to optimize generation speed
    // and provide richer variety without upstream timeouts.
    if (count > 5) {
      console.log(`[Batching] Generating ${count} flashcards in parallel batches of 5...`);
      const prompts = [
        `You are an expert school tutor. Generate exactly 5 educational study flashcards ${contextText}.
Focus on fundamental terms, core definitions, and primary concepts.
Create a brief, clear, engaging question or term for the "front" and a precise, easy-to-understand answer or explanation for the "back".
Return ONLY valid JSON in the format: [{"front": "...", "back": "..."}]`,
        `You are an expert school tutor. Generate exactly ${count - 5} educational study flashcards ${contextText}.
Focus on secondary topics, advanced applications, formulas, or deep-dive details (ensuring no duplication with introductory definitions).
Create a brief, clear, engaging question or term for the "front" and a precise, easy-to-understand answer or explanation for the "back".
Return ONLY valid JSON in the format: [{"front": "...", "back": "..."}]`
      ];

      const batchPromises = prompts.map(promptText => 
        callGeminiWithRetryAndFailover(ai, {
          model: "gemini-3.5-flash",
          contents: promptText,
          config: { responseMimeType: "application/json" }
        })
      );

      const responses = await Promise.all(batchPromises);
      for (const response of responses) {
        try {
          const parsed = JSON.parse(response.text || "[]");
          if (Array.isArray(parsed)) {
            finalCards.push(...parsed);
          }
        } catch (parseErr) {
          console.error("Batch parse error:", parseErr, "Text:", response.text);
        }
      }
    } else {
      // Single fast batch for standard sizes (3 or 5)
      const instructionText = `You are an expert school tutor. Generate exactly ${count} educational study flashcards ${contextText}.
Identify key terms, definitions, formulas, or concepts. For each, create a brief, clear, engaging question or term for the "front" and a precise, easy-to-understand answer or explanation for the "back".
Return ONLY valid JSON in the format: [{"front": "...", "back": "..."}]`;

      const response = await callGeminiWithRetryAndFailover(ai, {
        model: "gemini-3.5-flash",
        contents: instructionText,
        config: { responseMimeType: "application/json" }
      });

      try {
        finalCards = JSON.parse(response.text || "[]");
      } catch (parseErr) {
        console.error("Flashcards JSON parse error:", parseErr, "Text:", response.text);
      }
    }

    if (Array.isArray(finalCards) && finalCards.length > 0) {
      // Save to cache
      flashcardsMemoryCache.set(cacheKey, finalCards);
      res.json(finalCards);
    } else {
      throw new Error("Invalid or empty response format received from upstream API model for flashcards");
    }
  } catch (err: any) {
    console.warn("Gemini flashcard generation error (using fallback):", err.message || err);
    handleRouteError(res, err);
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
