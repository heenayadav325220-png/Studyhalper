"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc2) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc2 = __getOwnPropDesc(from, key)) || desc2.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  app: () => app
});
module.exports = __toCommonJS(server_exports);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_compression = __toESM(require("compression"), 1);
var import_genai = require("@google/genai");

// src/lib/firebase-admin.ts
var import_app = require("firebase-admin/app");
var import_auth = require("firebase-admin/auth");

// firebase-applet-config.json
var firebase_applet_config_default = {
  projectId: "coreai-a7cf4",
  appId: "1:152164036052:web:5e51334176a0b20debba41",
  apiKey: "AIzaSyCJXfFwq1FfTw_DvSkSbgOAhjToplnIWFg",
  authDomain: "coreai-a7cf4.firebaseapp.com",
  databaseURL: "https://coreai-a7cf4-default-rtdb.firebaseio.com",
  storageBucket: "coreai-a7cf4.firebasestorage.app",
  messagingSenderId: "152164036052",
  measurementId: "",
  oAuthClientId: "",
  recaptchaSiteKey: "",
  firestoreDatabaseId: "(default)"
};

// src/lib/firebase-admin.ts
if (!(0, import_app.getApps)().length) {
  (0, import_app.initializeApp)({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || firebase_applet_config_default.projectId
  });
}
var adminAuth = (0, import_auth.getAuth)();

// src/middleware/auth.ts
var requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: Missing token" });
    return;
  }
  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Error verifying Firebase ID token:", error);
    res.status(401).json({ error: "Unauthorized: Invalid token" });
    return;
  }
};

// src/db/index.ts
var import_node_postgres = require("drizzle-orm/node-postgres");
var import_pg = require("pg");

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  mockExams: () => mockExams,
  notes: () => notes,
  studySessions: () => studySessions,
  users: () => users,
  usersRelations: () => usersRelations
});
var import_drizzle_orm = require("drizzle-orm");
var import_pg_core = require("drizzle-orm/pg-core");
var users = (0, import_pg_core.pgTable)("users", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  uid: (0, import_pg_core.text)("uid").notNull().unique(),
  // Firebase Auth UID
  email: (0, import_pg_core.text)("email").notNull(),
  displayName: (0, import_pg_core.text)("display_name"),
  photoUrl: (0, import_pg_core.text)("photo_url"),
  xp: (0, import_pg_core.integer)("xp").default(0),
  streak: (0, import_pg_core.integer)("streak").default(1),
  petLevel: (0, import_pg_core.integer)("pet_level").default(1),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow(),
  lastStreakDate: (0, import_pg_core.text)("last_streak_date")
});
var notes = (0, import_pg_core.pgTable)("notes", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  uid: (0, import_pg_core.text)("uid").notNull(),
  // User's Firebase UID
  title: (0, import_pg_core.text)("title").notNull(),
  content: (0, import_pg_core.text)("content").notNull(),
  subject: (0, import_pg_core.text)("subject").notNull(),
  tags: (0, import_pg_core.text)("tags"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
});
var studySessions = (0, import_pg_core.pgTable)("study_sessions", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  uid: (0, import_pg_core.text)("uid").notNull(),
  subject: (0, import_pg_core.text)("subject").notNull(),
  topic: (0, import_pg_core.text)("topic"),
  durationMinutes: (0, import_pg_core.integer)("duration_minutes").notNull().default(25),
  xpEarned: (0, import_pg_core.integer)("xp_earned").default(25),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
});
var mockExams = (0, import_pg_core.pgTable)("mock_exams", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  uid: (0, import_pg_core.text)("uid").notNull(),
  subject: (0, import_pg_core.text)("subject").notNull(),
  score: (0, import_pg_core.integer)("score").notNull(),
  totalQuestions: (0, import_pg_core.integer)("total_questions").notNull(),
  details: (0, import_pg_core.text)("details"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
});
var usersRelations = (0, import_drizzle_orm.relations)(users, ({ many }) => ({
  notes: many(notes),
  studySessions: many(studySessions),
  mockExams: many(mockExams)
}));

// src/db/index.ts
var createPool = () => {
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    return null;
  }
  if (!global._postgresPool) {
    global._postgresPool = new import_pg.Pool({
      connectionString: process.env.DATABASE_URL,
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 15e3
    });
    global._postgresPool.on("error", (err) => {
      console.error("Unexpected error on idle SQL pool client:", err);
    });
  }
  return global._postgresPool;
};
var pool = createPool();
var dbInstance;
if (pool) {
  try {
    dbInstance = (0, import_node_postgres.drizzle)(pool, { schema: schema_exports });
  } catch (err) {
    console.warn("[AI Studio] Database connection error \u2014 using mock proxy:", err);
    const noOp = {
      findMany: async () => [],
      findFirst: async () => null,
      findUnique: async () => null,
      create: async (d) => d?.data ?? {},
      update: async (d) => d?.data ?? {},
      delete: async () => ({})
    };
    dbInstance = new Proxy({}, {
      get: (_, prop) => prop === "query" ? new Proxy({}, { get: () => noOp }) : async () => []
    });
  }
} else {
  const noOp = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d) => d?.data ?? {},
    update: async (d) => d?.data ?? {},
    delete: async () => ({})
  };
  dbInstance = new Proxy({}, {
    get: (_, prop) => prop === "query" ? new Proxy({}, { get: () => noOp }) : async () => []
  });
}
var db = dbInstance;

// src/db/users.ts
var import_drizzle_orm2 = require("drizzle-orm");
var memoryUsers = /* @__PURE__ */ new Map();
function getMemoryUser(uid, email, displayName, photoUrl) {
  if (!memoryUsers.has(uid)) {
    memoryUsers.set(uid, {
      id: Math.floor(Math.random() * 1e4) + 1,
      uid,
      email,
      displayName: displayName || email.split("@")[0],
      photoUrl: photoUrl || "",
      xp: 0,
      streak: 1,
      petLevel: 1,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    });
  } else {
    const existing = memoryUsers.get(uid);
    existing.email = email || existing.email;
    if (displayName) existing.displayName = displayName;
    if (photoUrl) existing.photoUrl = photoUrl;
    existing.updatedAt = /* @__PURE__ */ new Date();
  }
  return memoryUsers.get(uid);
}
async function getOrCreateUser(uid, email, displayName, photoUrl) {
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    return getMemoryUser(uid, email, displayName, photoUrl);
  }
  try {
    const result = await db.insert(users).values({
      uid,
      email,
      displayName: displayName || email.split("@")[0],
      photoUrl: photoUrl || ""
    }).onConflictDoUpdate({
      target: users.uid,
      set: {
        email,
        displayName: displayName || email.split("@")[0],
        photoUrl: photoUrl || "",
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return result[0];
  } catch (error) {
    console.warn("Database unavailable, falling back to memory store:", error);
    return getMemoryUser(uid, email, displayName, photoUrl);
  }
}
async function getUserProfile(uid) {
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    return memoryUsers.get(uid) || null;
  }
  try {
    const result = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.uid, uid)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.warn("Database unavailable, falling back to memory store:", error);
    return memoryUsers.get(uid) || null;
  }
}
async function updateUserStats(uid, xpEarned, streak) {
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    const user = memoryUsers.get(uid);
    if (!user) return null;
    user.xp = (user.xp || 0) + xpEarned;
    if (streak !== void 0) user.streak = streak;
    user.petLevel = Math.max(1, Math.floor(user.xp / 150) + 1);
    user.updatedAt = /* @__PURE__ */ new Date();
    return user;
  }
  try {
    const existing = await getUserProfile(uid);
    if (!existing) return null;
    const newXp = (existing.xp || 0) + xpEarned;
    const newStreak = streak !== void 0 ? streak : existing.streak;
    const newPetLevel = Math.max(1, Math.floor(newXp / 150) + 1);
    const result = await db.update(users).set({
      xp: newXp,
      streak: newStreak,
      petLevel: newPetLevel,
      updatedAt: /* @__PURE__ */ new Date()
    }).where((0, import_drizzle_orm2.eq)(users.uid, uid)).returning();
    return result[0];
  } catch (error) {
    console.warn("Database unavailable, falling back to memory store:", error);
    const user = memoryUsers.get(uid);
    if (user) {
      user.xp = (user.xp || 0) + xpEarned;
      if (streak !== void 0) user.streak = streak;
      user.petLevel = Math.max(1, Math.floor(user.xp / 150) + 1);
      user.updatedAt = /* @__PURE__ */ new Date();
      return user;
    }
    return null;
  }
}

// src/db/notes.ts
var import_drizzle_orm3 = require("drizzle-orm");
var memoryNotes = [];
var memoryStudySessions = [];
var memoryMockExams = [];
async function getUserNotes(uid) {
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    return memoryNotes.filter((n) => n.uid === uid).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
  try {
    return await db.select().from(notes).where((0, import_drizzle_orm3.eq)(notes.uid, uid)).orderBy((0, import_drizzle_orm3.desc)(notes.updatedAt));
  } catch (error) {
    console.warn("Database unavailable, falling back to memory notes:", error);
    return memoryNotes.filter((n) => n.uid === uid).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
}
async function createNote(uid, title, content, subject, tags) {
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    const newNote = {
      id: Math.floor(Math.random() * 1e4) + 1,
      uid,
      title,
      content,
      subject,
      tags: tags || "",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    memoryNotes.push(newNote);
    return newNote;
  }
  try {
    const result = await db.insert(notes).values({
      uid,
      title,
      content,
      subject,
      tags: tags || ""
    }).returning();
    return result[0];
  } catch (error) {
    console.warn("Database unavailable, falling back to memory notes:", error);
    const newNote = {
      id: Math.floor(Math.random() * 1e4) + 1,
      uid,
      title,
      content,
      subject,
      tags: tags || "",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    memoryNotes.push(newNote);
    return newNote;
  }
}
async function deleteNote(id, uid) {
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    const idx = memoryNotes.findIndex((n) => n.id === id && n.uid === uid);
    if (idx !== -1) {
      const deleted = memoryNotes.splice(idx, 1);
      return deleted[0];
    }
    return { id };
  }
  try {
    const result = await db.delete(notes).where((0, import_drizzle_orm3.and)((0, import_drizzle_orm3.eq)(notes.id, id), (0, import_drizzle_orm3.eq)(notes.uid, uid))).returning();
    return result[0];
  } catch (error) {
    console.warn("Database unavailable, falling back to memory notes:", error);
    const idx = memoryNotes.findIndex((n) => n.id === id && n.uid === uid);
    if (idx !== -1) {
      const deleted = memoryNotes.splice(idx, 1);
      return deleted[0];
    }
    return { id };
  }
}
async function logStudySession(uid, subject, durationMinutes, topic, xpEarned = 25) {
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    const session = {
      id: Math.floor(Math.random() * 1e4) + 1,
      uid,
      subject,
      durationMinutes,
      topic: topic || "",
      xpEarned,
      createdAt: /* @__PURE__ */ new Date()
    };
    memoryStudySessions.push(session);
    return session;
  }
  try {
    const result = await db.insert(studySessions).values({
      uid,
      subject,
      durationMinutes,
      topic: topic || "",
      xpEarned
    }).returning();
    return result[0];
  } catch (error) {
    console.warn("Database unavailable, falling back to memory study sessions:", error);
    const session = {
      id: Math.floor(Math.random() * 1e4) + 1,
      uid,
      subject,
      durationMinutes,
      topic: topic || "",
      xpEarned,
      createdAt: /* @__PURE__ */ new Date()
    };
    memoryStudySessions.push(session);
    return session;
  }
}
async function logMockExam(uid, subject, score, totalQuestions, details) {
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    const exam = {
      id: Math.floor(Math.random() * 1e4) + 1,
      uid,
      subject,
      score,
      totalQuestions,
      details: details || "",
      createdAt: /* @__PURE__ */ new Date()
    };
    memoryMockExams.push(exam);
    return exam;
  }
  try {
    const result = await db.insert(mockExams).values({
      uid,
      subject,
      score,
      totalQuestions,
      details: details || ""
    }).returning();
    return result[0];
  } catch (error) {
    console.warn("Database unavailable, falling back to memory mock exams:", error);
    const exam = {
      id: Math.floor(Math.random() * 1e4) + 1,
      uid,
      subject,
      score,
      totalQuestions,
      details: details || "",
      createdAt: /* @__PURE__ */ new Date()
    };
    memoryMockExams.push(exam);
    return exam;
  }
}

// src/middleware/security.ts
function securityHeaders(_req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), payment=(), usb=(), display-capture=(self)");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  next();
}
var SlidingWindowRateLimiter = class {
  requests = /* @__PURE__ */ new Map();
  windowMs;
  maxRequests;
  constructor(maxRequests = 60, windowSeconds = 60) {
    this.maxRequests = maxRequests;
    this.windowMs = windowSeconds * 1e3;
    setInterval(() => this.cleanup(), 2 * 60 * 1e3);
  }
  cleanup() {
    const cutoff = Date.now() - this.windowMs;
    for (const [ip, entry] of this.requests.entries()) {
      entry.timestamps = entry.timestamps.filter((ts) => ts > cutoff);
      if (entry.timestamps.length === 0) {
        this.requests.delete(ip);
      }
    }
  }
  check(ip) {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    let entry = this.requests.get(ip);
    if (!entry) {
      entry = { timestamps: [] };
      this.requests.set(ip, entry);
    }
    entry.timestamps = entry.timestamps.filter((ts) => ts > cutoff);
    if (entry.timestamps.length >= this.maxRequests) {
      const oldest = entry.timestamps[0];
      const resetTime = Math.ceil((oldest + this.windowMs - now) / 1e3);
      return { allowed: false, remaining: 0, resetTime: Math.max(1, resetTime) };
    }
    entry.timestamps.push(now);
    const remaining = this.maxRequests - entry.timestamps.length;
    return { allowed: true, remaining, resetTime: 60 };
  }
};
var aiEndpointLimiter = new SlidingWindowRateLimiter(60, 60);
var generalApiLimiter = new SlidingWindowRateLimiter(150, 60);
function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "127.0.0.1";
}
function rateLimitAi(req, res, next) {
  const ip = getClientIp(req);
  const result = aiEndpointLimiter.check(ip);
  res.setHeader("X-RateLimit-Limit", "60");
  res.setHeader("X-RateLimit-Remaining", result.remaining.toString());
  if (!result.allowed) {
    res.setHeader("Retry-After", result.resetTime.toString());
    res.status(429).json({
      error: "Too Many Requests",
      message: `Rate limit exceeded. To protect system security and prevent abuse, please retry in ${result.resetTime} seconds.`,
      code: "RATE_LIMIT_EXCEEDED"
    });
    return;
  }
  next();
}
function rateLimitGeneral(req, res, next) {
  const ip = getClientIp(req);
  const result = generalApiLimiter.check(ip);
  res.setHeader("X-RateLimit-Limit", "150");
  res.setHeader("X-RateLimit-Remaining", result.remaining.toString());
  if (!result.allowed) {
    res.setHeader("Retry-After", result.resetTime.toString());
    res.status(429).json({
      error: "Too Many Requests",
      message: "API rate limit reached. Please wait a moment before sending more requests.",
      code: "RATE_LIMIT_EXCEEDED"
    });
    return;
  }
  next();
}
function sanitizeInputs(req, res, next) {
  if (req.body && typeof req.body === "object") {
    try {
      sanitizeObject(req.body);
    } catch (err) {
      res.status(400).json({
        error: "Invalid Request Payload",
        message: err.message || "Input validation failed."
      });
      return;
    }
  }
  next();
}
function sanitizeObject(obj, depth = 0) {
  if (depth > 12) {
    throw new Error("Payload depth limit exceeded (potential circular injection).");
  }
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === "string") {
      if (val.includes("\0")) {
        throw new Error("Invalid payload: null bytes are forbidden.");
      }
      if (!val.startsWith("data:") && val.length > 5e4) {
        obj[key] = val.slice(0, 5e4);
      }
    } else if (val && typeof val === "object") {
      sanitizeObject(val, depth + 1);
    }
  }
}

// src/services/curriculumEngine.ts
var TOPIC_DATABASE = {
  photosynthesis: {
    title: "Photosynthesis (\u092A\u094D\u0930\u0915\u093E\u0936 \u0938\u0902\u0936\u094D\u0932\u0947\u0937\u0923)",
    subject: "Biology / Science",
    summaryEn: "Photosynthesis is the fundamental biochemical process by which green plants, algae, and certain bacteria convert radiant solar energy into chemical energy stored in glucose molecules.",
    summaryHi: "\u092A\u094D\u0930\u0915\u093E\u0936 \u0938\u0902\u0936\u094D\u0932\u0947\u0937\u0923 \u0935\u0939 \u091C\u0948\u0935-\u0930\u093E\u0938\u093E\u092F\u0928\u093F\u0915 \u092A\u094D\u0930\u0915\u094D\u0930\u093F\u092F\u093E \u0939\u0948 \u091C\u093F\u0938\u0915\u0947 \u0926\u094D\u0935\u093E\u0930\u093E \u0939\u0930\u0947 \u092A\u094C\u0927\u0947 \u0938\u0942\u0930\u094D\u092F \u0915\u0947 \u092A\u094D\u0930\u0915\u093E\u0936 \u0914\u0930 \u0915\u094D\u0932\u094B\u0930\u094B\u092B\u093F\u0932 \u0915\u0940 \u0909\u092A\u0938\u094D\u0925\u093F\u0924\u093F \u092E\u0947\u0902 \u091C\u0932 (H2O) \u0914\u0930 \u0915\u093E\u0930\u094D\u092C\u0928 \u0921\u093E\u0907\u0911\u0915\u094D\u0938\u093E\u0907\u0921 (CO2) \u0938\u0947 \u0917\u094D\u0932\u0942\u0915\u094B\u091C (\u090A\u0930\u094D\u091C\u093E) \u0914\u0930 \u0911\u0915\u094D\u0938\u0940\u091C\u0928 \u0915\u093E \u0928\u093F\u0930\u094D\u092E\u093E\u0923 \u0915\u0930\u0924\u0947 \u0939\u0948\u0902\u0964",
    stepsEn: [
      "Light Absorption: Chlorophyll pigments inside thylakoid membranes trap photon energy from sunlight.",
      "Light Reaction (Photolysis): Water molecules (H2O) are split into hydrogen ions, electrons, and free Oxygen (O2) gas.",
      "Energy Carrier Synthesis: ATP and NADPH are synthesized to power cellular processes.",
      "Dark Reaction (Calvin Cycle): In the stroma of chloroplasts, CO2 is fixed and reduced to produce high-energy glucose (C6H12O6)."
    ],
    stepsHi: [
      "\u092A\u094D\u0930\u0915\u093E\u0936 \u0905\u0935\u0936\u094B\u0937\u0923: \u0915\u094D\u0932\u094B\u0930\u094B\u092A\u094D\u0932\u093E\u0938\u094D\u091F \u0915\u0940 \u0925\u093E\u092F\u0932\u093E\u0915\u094B\u0907\u0921 \u091D\u093F\u0932\u094D\u0932\u0940 \u092E\u0947\u0902 \u092E\u094C\u091C\u0942\u0926 \u0915\u094D\u0932\u094B\u0930\u094B\u092B\u093F\u0932 \u0938\u0942\u0930\u094D\u092F \u0915\u0947 \u092A\u094D\u0930\u0915\u093E\u0936 \u0915\u0940 \u090A\u0930\u094D\u091C\u093E \u0915\u094B \u0905\u0935\u0936\u094B\u0937\u093F\u0924 \u0915\u0930\u0924\u093E \u0939\u0948\u0964",
      "\u092A\u094D\u0930\u0915\u093E\u0936\u093F\u0915 \u0905\u092D\u093F\u0915\u094D\u0930\u093F\u092F\u093E (\u091C\u0932 \u0915\u093E \u0905\u092A\u0918\u091F\u0928): \u092A\u094D\u0930\u0915\u093E\u0936 \u090A\u0930\u094D\u091C\u093E \u0926\u094D\u0935\u093E\u0930\u093E \u091C\u0932 (H2O) \u0915\u0947 \u0905\u0923\u0941 \u091F\u0942\u091F\u0915\u0930 \u0939\u093E\u0907\u0921\u094D\u0930\u094B\u091C\u0928 \u0914\u0930 \u0911\u0915\u094D\u0938\u0940\u091C\u0928 \u0917\u0948\u0938 (O2) \u092E\u0941\u0915\u094D\u0924 \u0915\u0930\u0924\u0947 \u0939\u0948\u0902\u0964",
      "\u090A\u0930\u094D\u091C\u093E \u0928\u093F\u0930\u094D\u092E\u093E\u0923: ATP \u0914\u0930 NADPH \u0915\u0947 \u0930\u0942\u092A \u092E\u0947\u0902 \u090A\u0930\u094D\u091C\u093E \u0938\u0902\u091A\u093F\u0924 \u0939\u094B\u0924\u0940 \u0939\u0948\u0964",
      "\u0905\u092A\u094D\u0930\u0915\u093E\u0936\u093F\u0915 \u0905\u092D\u093F\u0915\u094D\u0930\u093F\u092F\u093E (\u0915\u0947\u0932\u094D\u0935\u093F\u0928 \u091A\u0915\u094D\u0930): \u0938\u094D\u091F\u094D\u0930\u094B\u092E\u093E \u092E\u0947\u0902 CO2 \u0915\u093E \u0905\u092A\u091A\u092F\u0928 \u0939\u094B\u0915\u0930 \u0917\u094D\u0932\u0942\u0915\u094B\u091C (C6H12O6) \u0915\u093E \u0938\u0902\u0936\u094D\u0932\u0947\u0937\u0923 \u0939\u094B\u0924\u093E \u0939\u0948\u0964"
    ],
    formulas: [
      "Balanced Chemical Equation: 6CO\u2082 + 6H\u2082O + Sunlight \u2192 C\u2086H\u2081\u2082O\u2086 + 6O\u2082",
      "ADP + Pi + Light Energy \u2192 ATP (Photophosphorylation)"
    ],
    analogyEn: "Think of a plant leaf as a solar-powered organic bakery: Sunlight is the solar electricity, CO2 from the air and water from soil are raw ingredients, chlorophyll is the master chef, and glucose loaves with fresh oxygen are the final baked output!",
    analogyHi: "\u092A\u094C\u0927\u0947 \u0915\u0940 \u092A\u0924\u094D\u0924\u0940 \u0915\u094B \u090F\u0915 \u0938\u094B\u0932\u0930 \u092C\u0947\u0915\u0930\u0940 \u0915\u0940 \u0924\u0930\u0939 \u0938\u092E\u091D\u0947\u0902: \u0927\u0942\u092A \u092C\u0947\u0915\u0930\u0940 \u0915\u0940 \u092C\u093F\u091C\u0932\u0940 \u0939\u0948, \u0939\u0935\u093E \u0915\u0940 CO2 \u0914\u0930 \u092E\u093F\u091F\u094D\u091F\u0940 \u0915\u093E \u092A\u093E\u0928\u0940 \u0938\u093E\u092E\u0917\u094D\u0930\u0940 \u0939\u0948, \u0915\u094D\u0932\u094B\u0930\u094B\u092B\u093F\u0932 \u0936\u0947\u092B \u0939\u0948, \u0914\u0930 \u0924\u093E\u091C\u093E \u0917\u094D\u0932\u0942\u0915\u094B\u091C \u0914\u0930 \u0936\u0941\u0926\u094D\u0927 \u0911\u0915\u094D\u0938\u0940\u091C\u0928 \u0905\u0902\u0924\u093F\u092E \u0909\u0924\u094D\u092A\u093E\u0926 \u0939\u0948\u0902!",
    tipsEn: [
      "Board Exam Favorite: Always mention both Light reaction (Thylakoids) and Dark reaction (Stroma).",
      "Balance the chemical equation correctly with 6CO2 and 6H2O."
    ],
    tipsHi: [
      "\u092A\u0930\u0940\u0915\u094D\u0937\u093E \u091F\u093F\u092A: \u092A\u094D\u0930\u0915\u093E\u0936\u093F\u0915 \u0905\u092D\u093F\u0915\u094D\u0930\u093F\u092F\u093E (\u0925\u093E\u092F\u0932\u093E\u0915\u094B\u0907\u0921) \u0914\u0930 \u0921\u093E\u0930\u094D\u0915 \u0930\u093F\u090F\u0915\u094D\u0936\u0928 (\u0938\u094D\u091F\u094D\u0930\u094B\u092E\u093E) \u0926\u094B\u0928\u094B\u0902 \u0915\u093E \u0909\u0932\u094D\u0932\u0947\u0916 \u0905\u0935\u0936\u094D\u092F \u0915\u0930\u0947\u0902\u0964",
      "\u0938\u092E\u0940\u0915\u0930\u0923 \u0915\u094B \u0938\u0902\u0924\u0941\u0932\u093F\u0924 \u0932\u093F\u0916\u0928\u093E \u0915\u092D\u0940 \u0928 \u092D\u0942\u0932\u0947\u0902 (6CO2 + 6H2O -> C6H12O6 + 6O2)\u0964"
    ],
    quizQuestionEn: "Where do the light-dependent reactions of photosynthesis take place inside the chloroplast?",
    quizQuestionHi: "\u092A\u094D\u0930\u0915\u093E\u0936 \u0938\u0902\u0936\u094D\u0932\u0947\u0937\u0923 \u0915\u0940 \u092A\u094D\u0930\u0915\u093E\u0936\u093F\u0915 \u0905\u092D\u093F\u0915\u094D\u0930\u093F\u092F\u093E \u0915\u094D\u0932\u094B\u0930\u094B\u092A\u094D\u0932\u093E\u0938\u094D\u091F \u0915\u0947 \u0915\u093F\u0938 \u092D\u093E\u0917 \u092E\u0947\u0902 \u0938\u0902\u092A\u0928\u094D\u0928 \u0939\u094B\u0924\u0940 \u0939\u0948?"
  },
  newton: {
    title: "Newton's Laws of Motion (\u0928\u094D\u092F\u0942\u091F\u0928 \u0915\u0947 \u0917\u0924\u093F \u0915\u0947 \u0928\u093F\u092F\u092E)",
    subject: "Physics",
    summaryEn: "Newton's three laws of motion establish the bedrock of classical mechanics, describing how external forces influence the movement, inertia, and momentum of physical bodies.",
    summaryHi: "\u0928\u094D\u092F\u0942\u091F\u0928 \u0915\u0947 \u0917\u0924\u093F \u0915\u0947 \u0924\u0940\u0928 \u0928\u093F\u092F\u092E \u0936\u093E\u0938\u094D\u0924\u094D\u0930\u0940\u092F \u092D\u094C\u0924\u093F\u0915\u0940 (Classical Mechanics) \u0915\u093E \u0906\u0927\u093E\u0930 \u0939\u0948\u0902, \u091C\u094B \u092C\u0924\u093E\u0924\u0947 \u0939\u0948\u0902 \u0915\u093F \u092C\u0932 (Force), \u0926\u094D\u0930\u0935\u094D\u092F\u092E\u093E\u0928 (Mass), \u0914\u0930 \u0924\u094D\u0935\u0930\u0923 (Acceleration) \u090F\u0915-\u0926\u0942\u0938\u0930\u0947 \u0938\u0947 \u0915\u093F\u0938 \u092A\u094D\u0930\u0915\u093E\u0930 \u0938\u0902\u092C\u0902\u0927\u093F\u0924 \u0939\u0948\u0902\u0964",
    stepsEn: [
      "First Law (Law of Inertia): An object remains at rest or in uniform motion unless acted upon by a non-zero external net force.",
      "Second Law (Fundamental Law): The rate of change of momentum of a body is directly proportional to the applied force: F = dp/dt = m \xB7 a.",
      "Third Law (Action & Reaction): To every action, there is always an equal and opposite reaction acting on two distinct interacting bodies."
    ],
    stepsHi: [
      "\u092A\u094D\u0930\u0925\u092E \u0928\u093F\u092F\u092E (\u091C\u0921\u093C\u0924\u094D\u0935 \u0915\u093E \u0928\u093F\u092F\u092E): \u0915\u094B\u0908 \u0935\u0938\u094D\u0924\u0941 \u0935\u093F\u0930\u093E\u092E \u0905\u0925\u0935\u093E \u0938\u092E\u093E\u0928 \u0917\u0924\u093F \u092E\u0947\u0902 \u0924\u092C \u0924\u0915 \u0930\u0939\u0924\u0940 \u0939\u0948 \u091C\u092C \u0924\u0915 \u0909\u0938 \u092A\u0930 \u0915\u094B\u0908 \u092C\u093E\u0939\u0930\u0940 \u0905\u0938\u0902\u0924\u0941\u0932\u093F\u0924 \u092C\u0932 \u0928 \u0932\u0917\u093E\u092F\u093E \u091C\u093E\u090F\u0964",
      "\u0926\u094D\u0935\u093F\u0924\u0940\u092F \u0928\u093F\u092F\u092E (\u0938\u0902\u0935\u0947\u0917 \u0915\u093E \u0928\u093F\u092F\u092E): \u0915\u093F\u0938\u0940 \u0935\u0938\u094D\u0924\u0941 \u0915\u0947 \u0938\u0902\u0935\u0947\u0917 \u092A\u0930\u093F\u0935\u0930\u094D\u0924\u0928 \u0915\u0940 \u0926\u0930 \u0932\u0917\u093E\u090F \u0917\u090F \u092C\u0932 \u0915\u0947 \u0938\u092E\u093E\u0928\u0941\u092A\u093E\u0924\u0940 \u0939\u094B\u0924\u0940 \u0939\u0948: F = m \xD7 a\u0964",
      "\u0924\u0943\u0924\u0940\u092F \u0928\u093F\u092F\u092E (\u0915\u094D\u0930\u093F\u092F\u093E-\u092A\u094D\u0930\u0924\u093F\u0915\u094D\u0930\u093F\u092F\u093E \u0928\u093F\u092F\u092E): \u092A\u094D\u0930\u0924\u094D\u092F\u0947\u0915 \u0915\u094D\u0930\u093F\u092F\u093E \u0915\u0947 \u092C\u0930\u093E\u092C\u0930 \u0914\u0930 \u0935\u093F\u092A\u0930\u0940\u0924 \u0926\u093F\u0936\u093E \u092E\u0947\u0902 \u092A\u094D\u0930\u0924\u093F\u0915\u094D\u0930\u093F\u092F\u093E \u0939\u094B\u0924\u0940 \u0939\u0948\u0964"
    ],
    formulas: [
      "Second Law: F = m \xD7 a  (Force = Mass \xD7 Acceleration)",
      "Momentum: p = m \xD7 v  (Momentum = Mass \xD7 Velocity)",
      "Impulse: J = F \xB7 \u0394t = \u0394p (Change in Momentum)"
    ],
    analogyEn: "When a bus suddenly brakes, your body lurches forward because your upper body wants to maintain its forward velocity (Inertia). When you push against a swimming pool wall, the wall pushes you forward into the water with equal force (Action-Reaction)!",
    analogyHi: "\u091C\u092C \u092C\u0938 \u0905\u091A\u093E\u0928\u0915 \u0930\u0941\u0915\u0924\u0940 \u0939\u0948, \u0924\u094B \u0906\u092A\u0915\u093E \u0936\u0930\u0940\u0930 \u0906\u0917\u0947 \u0915\u0940 \u0913\u0930 \u091D\u0941\u0915 \u091C\u093E\u0924\u093E \u0939\u0948 (\u091C\u0921\u093C\u0924\u094D\u0935)\u0964 \u091C\u092C \u0906\u092A \u0924\u0948\u0930\u093E\u0915\u0940 \u092E\u0947\u0902 \u0926\u0940\u0935\u093E\u0930 \u0915\u094B \u092A\u0940\u091B\u0947 \u0927\u0915\u0947\u0932\u0924\u0947 \u0939\u0948\u0902, \u0924\u094B \u0926\u0940\u0935\u093E\u0930 \u0906\u092A\u0915\u094B \u0906\u0917\u0947 \u0915\u0940 \u0924\u0930\u092B \u0938\u092E\u093E\u0928 \u092C\u0932 \u0938\u0947 \u0927\u0915\u094D\u0915\u093E \u0926\u0947\u0924\u0940 \u0939\u0948 (\u0915\u094D\u0930\u093F\u092F\u093E-\u092A\u094D\u0930\u0924\u093F\u0915\u094D\u0930\u093F\u092F\u093E)!",
    tipsEn: [
      "Always remember that Action and Reaction forces act on TWO DIFFERENT bodies, so they NEVER cancel each other out.",
      "Force SI unit is Newton (N = kg\xB7m/s\xB2)."
    ],
    tipsHi: [
      "\u092F\u093E\u0926 \u0930\u0916\u0947\u0902: \u0915\u094D\u0930\u093F\u092F\u093E \u0914\u0930 \u092A\u094D\u0930\u0924\u093F\u0915\u094D\u0930\u093F\u092F\u093E \u092C\u0932 \u0926\u094B \u0905\u0932\u0917-\u0905\u0932\u0917 \u0935\u0938\u094D\u0924\u0941\u0913\u0902 \u092A\u0930 \u0915\u093E\u0930\u094D\u092F \u0915\u0930\u0924\u0947 \u0939\u0948\u0902, \u0907\u0938\u0932\u093F\u090F \u0935\u0947 \u090F\u0915-\u0926\u0942\u0938\u0930\u0947 \u0915\u094B \u0928\u093F\u0930\u0938\u094D\u0924 \u0928\u0939\u0940\u0902 \u0915\u0930\u0924\u0947\u0964",
      "\u092C\u0932 \u0915\u093E SI \u092E\u093E\u0924\u094D\u0930\u0915 \u0928\u094D\u092F\u0942\u091F\u0928 (N = kg\xB7m/s\xB2) \u0939\u094B\u0924\u093E \u0939\u0948\u0964"
    ],
    quizQuestionEn: "If a 5 kg object accelerates at 4 m/s\xB2, what is the magnitude of the net applied force?",
    quizQuestionHi: "\u092F\u0926\u093F 5 \u0915\u093F\u0917\u094D\u0930\u093E \u0915\u0940 \u0935\u0938\u094D\u0924\u0941 \u092A\u0930 4 m/s\xB2 \u0915\u093E \u0924\u094D\u0935\u0930\u0923 \u0909\u0924\u094D\u092A\u0928\u094D\u0928 \u0939\u094B\u0924\u093E \u0939\u0948, \u0924\u094B \u0932\u0917\u093E\u090F \u0917\u090F \u0915\u0941\u0932 \u092C\u0932 \u0915\u093E \u092E\u093E\u0928 \u0915\u094D\u092F\u093E \u0939\u094B\u0917\u093E?"
  },
  calculus: {
    title: "Calculus & Derivatives (\u0915\u0932\u0928 \u0914\u0930 \u0905\u0935\u0915\u0932\u0928)",
    subject: "Mathematics",
    summaryEn: "Calculus is the mathematical study of continuous change. Differential calculus focuses on rates of change and slopes of curves, while integral calculus focuses on accumulation and areas.",
    summaryHi: "\u0915\u0932\u0928 (Calculus) \u0928\u093F\u0930\u0902\u0924\u0930 \u092A\u0930\u093F\u0935\u0930\u094D\u0924\u0928 \u0915\u093E \u0905\u0927\u094D\u092F\u092F\u0928 \u0939\u0948\u0964 \u0905\u0935\u0915\u0932\u0928 (Differentiation) \u092A\u0930\u093F\u0935\u0930\u094D\u0924\u0928 \u0915\u0940 \u0924\u093E\u0924\u094D\u0915\u093E\u0932\u093F\u0915 \u0926\u0930 (Instantaneous Rate) \u0914\u0930 \u0935\u0915\u094D\u0930 \u0915\u0947 \u0922\u093E\u0932 (Slope) \u0915\u094B \u091C\u094D\u091E\u093E\u0924 \u0915\u0930\u0924\u093E \u0939\u0948\u0964",
    stepsEn: [
      "First Principles Definition: f'(x) = lim(h\u21920) [f(x + h) - f(x)] / h.",
      "Power Rule: d/dx [x\u207F] = n \xB7 x\u207F\u207B\xB9.",
      "Product Rule: d/dx [u \xB7 v] = u'v + uv'.",
      "Chain Rule: d/dx [f(g(x))] = f'(g(x)) \xB7 g'(x)."
    ],
    stepsHi: [
      "\u092A\u094D\u0930\u0925\u092E \u0938\u093F\u0926\u094D\u0927\u093E\u0902\u0924 \u092A\u0930\u093F\u092D\u093E\u0937\u093E: f'(x) = lim(h\u21920) [f(x + h) - f(x)] / h\u0964",
      "\u0918\u093E\u0924 \u0928\u093F\u092F\u092E (Power Rule): d/dx [x\u207F] = n \xB7 x\u207F\u207B\xB9\u0964",
      "\u0917\u0941\u0923\u0928 \u0928\u093F\u092F\u092E (Product Rule): d/dx [u \xB7 v] = u'v + uv'\u0964",
      "\u0936\u094D\u0930\u0943\u0902\u0916\u0932\u093E \u0928\u093F\u092F\u092E (Chain Rule): d/dx [f(g(x))] = f'(g(x)) \xB7 g'(x)\u0964"
    ],
    formulas: [
      "d/dx (sin x) = cos x",
      "d/dx (cos x) = -sin x",
      "d/dx (e\u02E3) = e\u02E3",
      "d/dx (ln x) = 1/x"
    ],
    analogyEn: "If a car speedometer shows 60 km/h right this second, that instantaneous speed is a derivative (dx/dt) of the position function. The total distance traveled across an entire journey is the integral (area under the curve)!",
    analogyHi: "\u0915\u093E\u0930 \u0915\u093E \u0938\u094D\u092A\u0940\u0921\u094B\u092E\u0940\u091F\u0930 \u0907\u0938 \u092A\u0932 \u091C\u094B \u0917\u0924\u093F \u0926\u093F\u0916\u093E \u0930\u0939\u093E \u0939\u0948, \u0935\u0939 \u0938\u094D\u0925\u093F\u0924\u093F \u0915\u093E \u0905\u0935\u0915\u0932\u0928 (dx/dt) \u0939\u0948\u0964 \u0914\u0930 \u092A\u0942\u0930\u0940 \u092F\u093E\u0924\u094D\u0930\u093E \u092E\u0947\u0902 \u0924\u092F \u0915\u0940 \u0917\u0908 \u0915\u0941\u0932 \u0926\u0942\u0930\u0940 \u0917\u0924\u093F \u0935\u0915\u094D\u0930 \u0915\u093E \u0938\u092E\u093E\u0915\u0932\u0928 (Integral) \u0939\u0948!",
    tipsEn: [
      "Never forget the chain rule when differentiating composite functions like sin(x\xB2).",
      "Check points where f'(x) = 0 to find local maxima and minima."
    ],
    tipsHi: [
      "\u092E\u093F\u0936\u094D\u0930\u093F\u0924 \u092B\u0932\u0928\u094B\u0902 \u091C\u0948\u0938\u0947 sin(x\xB2) \u0915\u093E \u0905\u0935\u0915\u0932\u0928 \u0915\u0930\u0924\u0947 \u0938\u092E\u092F \u091A\u0947\u0928 \u0930\u0942\u0932 \u0932\u0917\u093E\u0928\u093E \u0915\u092D\u0940 \u0928 \u092D\u0942\u0932\u0947\u0902\u0964",
      "\u0909\u091A\u094D\u091A\u093F\u0937\u094D\u0920 (Maxima) \u0914\u0930 \u0928\u093F\u092E\u094D\u0928\u093F\u0937\u094D\u0920 (Minima) \u091C\u094D\u091E\u093E\u0924 \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F f'(x) = 0 \u0939\u0932 \u0915\u0930\u0947\u0902\u0964"
    ],
    quizQuestionEn: "What is the derivative of f(x) = 3x\u2074 - 5x\xB2 + 7 with respect to x?",
    quizQuestionHi: "f(x) = 3x\u2074 - 5x\xB2 + 7 \u0915\u093E x \u0915\u0947 \u0938\u093E\u092A\u0947\u0915\u094D\u0937 \u0905\u0935\u0915\u0932\u0928 \u0915\u094D\u092F\u093E \u0939\u094B\u0917\u093E?"
  },
  gravity: {
    title: "Universal Gravitation (\u0938\u093E\u0930\u094D\u0935\u0924\u094D\u0930\u093F\u0915 \u0917\u0941\u0930\u0941\u0924\u094D\u0935\u093E\u0915\u0930\u094D\u0937\u0923)",
    subject: "Physics",
    summaryEn: "Gravity is the universal attractive force that acts between all bodies possessing mass or energy, described classically by Newton's Universal Law of Gravitation.",
    summaryHi: "\u0917\u0941\u0930\u0941\u0924\u094D\u0935\u093E\u0915\u0930\u094D\u0937\u0923 \u092C\u094D\u0930\u0939\u094D\u092E\u093E\u0902\u0921 \u092E\u0947\u0902 \u0915\u093F\u0928\u094D\u0939\u0940\u0902 \u092D\u0940 \u0926\u094B \u0926\u094D\u0930\u0935\u094D\u092F\u092E\u093E\u0928 \u0935\u093E\u0932\u0940 \u0935\u0938\u094D\u0924\u0941\u0913\u0902 \u0915\u0947 \u092C\u0940\u091A \u0932\u0917\u0928\u0947 \u0935\u093E\u0932\u093E \u090F\u0915 \u0938\u093E\u0930\u094D\u0935\u0924\u094D\u0930\u093F\u0915 \u0906\u0915\u0930\u094D\u0937\u0923 \u092C\u0932 \u0939\u0948\u0964",
    stepsEn: [
      "Mutual Attraction: Every mass attracts every other mass directly proportional to the product of their masses.",
      "Inverse Square Law: Force decreases with the square of the separation distance: F \u221D 1/r\xB2.",
      "Acceleration due to gravity at surface: g = GM / R\xB2 (approx 9.8 m/s\xB2 on Earth)."
    ],
    stepsHi: [
      "\u092A\u0930\u0938\u094D\u092A\u0930 \u0906\u0915\u0930\u094D\u0937\u0923: \u0915\u093F\u0928\u094D\u0939\u0940\u0902 \u0926\u094B \u092A\u093F\u0902\u0921\u094B\u0902 \u0915\u0947 \u092C\u0940\u091A \u0906\u0915\u0930\u094D\u0937\u0923 \u092C\u0932 \u0909\u0928\u0915\u0947 \u0926\u094D\u0930\u0935\u094D\u092F\u092E\u093E\u0928\u094B\u0902 \u0915\u0947 \u0917\u0941\u0923\u0928\u092B\u0932 \u0915\u0947 \u0938\u092E\u093E\u0928\u0941\u092A\u093E\u0924\u0940 \u0939\u094B\u0924\u093E \u0939\u0948\u0964",
      "\u0935\u094D\u092F\u0941\u0924\u094D\u0915\u094D\u0930\u092E \u0935\u0930\u094D\u0917 \u0928\u093F\u092F\u092E: \u092F\u0939 \u092C\u0932 \u0909\u0928\u0915\u0940 \u092C\u0940\u091A \u0915\u0940 \u0926\u0942\u0930\u0940 \u0915\u0947 \u0935\u0930\u094D\u0917 \u0915\u0947 \u0935\u094D\u092F\u0941\u0924\u094D\u0915\u094D\u0930\u092E\u093E\u0928\u0941\u092A\u093E\u0924\u0940 \u0939\u094B\u0924\u093E \u0939\u0948: F \u221D 1/r\xB2\u0964",
      "\u0917\u0941\u0930\u0941\u0924\u094D\u0935\u0940\u092F \u0924\u094D\u0935\u0930\u0923: \u092A\u0943\u0925\u094D\u0935\u0940 \u0915\u0940 \u0938\u0924\u0939 \u092A\u0930 g = GM / R\xB2 (\u0932\u0917\u092D\u0917 9.8 m/s\xB2)\u0964"
    ],
    formulas: [
      "F = G \xB7 (m\u2081 \xB7 m\u2082) / r\xB2",
      "Universal Constant G = 6.674 \xD7 10\u207B\xB9\xB9 N\xB7m\xB2/kg\xB2",
      "Weight: W = m \xB7 g"
    ],
    analogyEn: "Imagine space as a stretched rubber sheet: a heavy bowling ball (the Sun or Earth) creates a dip, causing smaller marbles (moons or satellites) to orbit around it along curved paths!",
    analogyHi: "\u0905\u0902\u0924\u0930\u093F\u0915\u094D\u0937 \u0915\u094B \u090F\u0915 \u0916\u093F\u0902\u091A\u0940 \u0939\u0941\u0908 \u0930\u092C\u0930 \u0915\u0940 \u091A\u093E\u0926\u0930 \u0915\u0940 \u0924\u0930\u0939 \u0938\u092E\u091D\u0947\u0902: \u092D\u093E\u0930\u0940 \u0917\u0947\u0902\u0926 (\u0938\u0942\u0930\u094D\u092F \u092F\u093E \u092A\u0943\u0925\u094D\u0935\u0940) \u0917\u0921\u094D\u0922\u093E \u092C\u0928\u093E\u0924\u0940 \u0939\u0948, \u091C\u093F\u0938\u0938\u0947 \u091B\u094B\u091F\u0940 \u0917\u0947\u0902\u0926\u0947\u0902 (\u0909\u092A\u0917\u094D\u0930\u0939) \u0909\u0938\u0915\u0947 \u091A\u093E\u0930\u094B\u0902 \u0913\u0930 \u0917\u094B\u0932 \u091A\u0915\u094D\u0915\u0930 \u0915\u093E\u091F\u0924\u0940 \u0939\u0948\u0902!",
    tipsEn: [
      "G is universal constant everywhere, while g varies with altitude, depth, and celestial body.",
      "If distance doubles, gravitational attraction drops to 1/4th of original value."
    ],
    tipsHi: [
      "\u0938\u093E\u0930\u094D\u0935\u0924\u094D\u0930\u093F\u0915 \u0928\u093F\u092F\u0924\u093E\u0902\u0915 G \u0939\u0930 \u091C\u0917\u0939 \u0938\u092E\u093E\u0928 \u0930\u0939\u0924\u093E \u0939\u0948, \u091C\u092C\u0915\u093F g \u090A\u0902\u091A\u093E\u0908 \u0914\u0930 \u0917\u0939\u0930\u093E\u0908 \u0915\u0947 \u0938\u093E\u0925 \u092C\u0926\u0932\u0924\u093E \u0939\u0948\u0964",
      "\u092F\u0926\u093F \u0926\u0942\u0930\u0940 \u0926\u094B\u0917\u0941\u0928\u0940 \u0915\u0930 \u0926\u0940 \u091C\u093E\u090F, \u0924\u094B \u0917\u0941\u0930\u0941\u0924\u094D\u0935\u093E\u0915\u0930\u094D\u0937\u0923 \u092C\u0932 \u0918\u091F\u0915\u0930 \u090F\u0915 \u091A\u094C\u0925\u093E\u0908 (1/4) \u0930\u0939 \u091C\u093E\u0924\u093E \u0939\u0948\u0964"
    ],
    quizQuestionEn: "How does the gravitational attraction between two objects change if the distance between their centers is tripled?",
    quizQuestionHi: "\u092F\u0926\u093F \u0926\u094B \u0935\u0938\u094D\u0924\u0941\u0913\u0902 \u0915\u0947 \u092C\u0940\u091A \u0915\u0940 \u0926\u0942\u0930\u0940 \u0924\u0940\u0928 \u0917\u0941\u0928\u0940 \u0915\u0930 \u0926\u0940 \u091C\u093E\u090F, \u0924\u094B \u0909\u0928\u0915\u0947 \u092C\u0940\u091A \u0917\u0941\u0930\u0941\u0924\u094D\u0935\u093E\u0915\u0930\u094D\u0937\u0923 \u092C\u0932 \u0915\u093F\u0924\u0928\u093E \u0917\u0941\u0928\u093E \u0939\u094B \u091C\u093E\u090F\u0917\u093E?"
  }
};
function generateCurriculumStudyAnswer(params) {
  const { prompt, language = "en", persona = "default", studentContext, isApiKeyIssue = false } = params;
  const lowerPrompt = (prompt || "").toLowerCase();
  const isHi = language === "hi" || language === "Hindi";
  const isHinglish = language === "Hinglish" || language === "Mixed";
  let matchedTopic = null;
  if (lowerPrompt.includes("photo") || lowerPrompt.includes("\u092A\u094D\u0930\u0915\u093E\u0936 \u0938\u0902\u0936\u094D\u0932\u0947\u0937\u0923") || lowerPrompt.includes("chlorophyll") || lowerPrompt.includes("plant food")) {
    matchedTopic = TOPIC_DATABASE.photosynthesis;
  } else if (lowerPrompt.includes("newton") || lowerPrompt.includes("\u0928\u094D\u092F\u0942\u091F\u0928") || lowerPrompt.includes("motion") || lowerPrompt.includes("inertia") || lowerPrompt.includes("force")) {
    matchedTopic = TOPIC_DATABASE.newton;
  } else if (lowerPrompt.includes("derivative") || lowerPrompt.includes("calculus") || lowerPrompt.includes("\u0905\u0935\u0915\u0932\u0928") || lowerPrompt.includes("dx") || lowerPrompt.includes("integral") || lowerPrompt.includes("\u0938\u092E\u093E\u0915\u0932\u0928")) {
    matchedTopic = TOPIC_DATABASE.calculus;
  } else if (lowerPrompt.includes("gravit") || lowerPrompt.includes("\u0917\u0941\u0930\u0941\u0924\u094D\u0935\u093E\u0915\u0930\u094D\u0937\u0923") || lowerPrompt.includes("gravity") || lowerPrompt.includes("g = ")) {
    matchedTopic = TOPIC_DATABASE.gravity;
  }
  const studentSalutation = studentContext?.name ? isHi ? `\u0928\u092E\u0938\u094D\u0924\u0947 **${studentContext.name}**! ` : isHinglish ? `Hello **${studentContext.name}**! ` : `Hello **${studentContext.name}**! ` : "";
  let output = "";
  if (matchedTopic) {
    const summary = isHi ? matchedTopic.summaryHi : matchedTopic.summaryEn;
    const steps = isHi ? matchedTopic.stepsHi : matchedTopic.stepsEn;
    const analogy = isHi ? matchedTopic.analogyHi : matchedTopic.analogyEn;
    const tips = isHi ? matchedTopic.tipsHi : matchedTopic.tipsEn;
    const quiz = isHi ? matchedTopic.quizQuestionHi : matchedTopic.quizQuestionEn;
    output = `### \u{1F4A1} ${isHi ? "\u0905\u0935\u0927\u093E\u0930\u0923\u093E \u0938\u093E\u0930\u093E\u0902\u0936 (Executive Summary)" : "Executive Summary"}: ${matchedTopic.title}
${studentSalutation}${summary}

---

### \u{1F4D0} ${isHi ? "\u091A\u0930\u0923\u092C\u0926\u094D\u0927 \u0935\u093F\u0927\u093F \u090F\u0935\u0902 \u092E\u0941\u0916\u094D\u092F \u0928\u093F\u092F\u092E (Step-by-Step Logic & Derivation)" : "Step-by-Step Logic & Core Principles"}
${steps.map((step, idx) => `${idx + 1}. **${isHi ? `\u091A\u0930\u0923 ${idx + 1}` : `Step ${idx + 1}`}**: ${step}`).join("\n")}

${matchedTopic.formulas && matchedTopic.formulas.length > 0 ? `
#### \u{1F4DD} ${isHi ? "\u092E\u0939\u0924\u094D\u0935\u092A\u0942\u0930\u094D\u0923 \u0938\u0942\u0924\u094D\u0930 (Key Formulas)" : "Core Mathematical Formulas"}
${matchedTopic.formulas.map((f) => `- \`${f}\``).join("\n")}
` : ""}

---

### \u{1F30D} ${isHi ? "\u0935\u093E\u0938\u094D\u0924\u0935\u093F\u0915 \u091C\u0940\u0935\u0928 \u0915\u093E \u0909\u0926\u093E\u0939\u0930\u0923 (Everyday Analogy)" : "Real-World Analogy & Everyday Intuition"}
> ${analogy}

---

### \u{1F4CC} ${isHi ? "\u092A\u0930\u0940\u0915\u094D\u0937\u093E \u0915\u0947 \u0932\u093F\u090F \u0909\u091A\u094D\u091A-\u092A\u094D\u0930\u093E\u0925\u092E\u093F\u0915\u0924\u093E \u092C\u093F\u0902\u0926\u0941 (High-Yield Exam Tips)" : "High-Yield Exam Tips"}
${tips.map((t) => `- \u{1F3AF} ${t}`).join("\n")}

---

### \u{1F9E0} ${isHi ? "\u0905\u092D\u094D\u092F\u093E\u0938 \u092A\u094D\u0930\u0936\u094D\u0928 (Quick Self-Check)" : "Quick Self-Check Question"}
**${quiz}**
*(Think about the core formulas above and solve this in your notebook!)*`;
  } else {
    const topicHeading = prompt.length > 60 ? `${prompt.slice(0, 57)}...` : prompt;
    if (isHi) {
      output = `### \u{1F4A1} \u0905\u0935\u0927\u093E\u0930\u0923\u093E \u0938\u093E\u0930\u093E\u0902\u0936 (Executive Summary): ${topicHeading}
${studentSalutation}\u0907\u0938 \u0935\u093F\u0937\u092F \u0915\u094B \u0938\u0930\u0932\u0924\u093E \u0938\u0947 \u0938\u092E\u091D\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u092E\u0941\u0916\u094D\u092F \u092C\u093F\u0902\u0926\u0941\u0913\u0902 \u0915\u093E \u0915\u094D\u0930\u092E\u092C\u0926\u094D\u0927 \u0935\u093F\u0936\u094D\u0932\u0947\u0937\u0923 \u0928\u0940\u091A\u0947 \u0926\u093F\u092F\u093E \u0917\u092F\u093E \u0939\u0948:

---

### \u{1F4D0} \u091A\u0930\u0923\u092C\u0926\u094D\u0927 \u0935\u0948\u091C\u094D\u091E\u093E\u0928\u093F\u0915 \u090F\u0935\u0902 \u0924\u093E\u0930\u094D\u0915\u093F\u0915 \u0926\u0943\u0937\u094D\u091F\u093F\u0915\u094B\u0923 (Step-by-Step Logic)
1. **\u092E\u0942\u0932 \u0938\u093F\u0926\u094D\u0927\u093E\u0902\u0924 (Fundamental Principle)**: \u0915\u093F\u0938\u0940 \u092D\u0940 \u0935\u093F\u0937\u092F \u092F\u093E \u0938\u092E\u0938\u094D\u092F\u093E \u0915\u094B \u0939\u0932 \u0915\u0930\u0928\u0947 \u0938\u0947 \u092A\u0939\u0932\u0947 \u0909\u0938\u0915\u0947 \u092E\u0942\u0932\u092D\u0942\u0924 \u0928\u093F\u092F\u092E\u094B\u0902, \u091C\u094D\u091E\u093E\u0924 \u092E\u093E\u0928\u094B\u0902 (Given values) \u0914\u0930 \u0905\u091C\u094D\u091E\u093E\u0924 \u0932\u0915\u094D\u0937\u094D\u092F\u094B\u0902 \u0915\u094B \u0938\u094D\u092A\u0937\u094D\u091F \u0930\u0942\u092A \u0938\u0947 \u0938\u0942\u091A\u0940\u092C\u0926\u094D\u0927 \u0915\u0930\u0947\u0902\u0964
2. **\u092A\u0926\u094D\u0927\u0924\u093F \u090F\u0935\u0902 \u0905\u0928\u0941\u092A\u094D\u0930\u092F\u094B\u0917 (Methodology)**:
   - \u092E\u093E\u0928\u0915 \u092A\u0930\u093F\u092D\u093E\u0937\u093E\u0913\u0902 \u0914\u0930 \u0938\u0942\u0924\u094D\u0930\u094B\u0902 \u0915\u093E \u0938\u091F\u0940\u0915 \u091A\u092F\u0928 \u0915\u0930\u0947\u0902\u0964
   - \u091C\u091F\u093F\u0932 \u0938\u092E\u0938\u094D\u092F\u093E \u0915\u094B 2-3 \u091B\u094B\u091F\u0947 \u0906\u0938\u093E\u0928 \u091A\u0930\u0923\u094B\u0902 \u092E\u0947\u0902 \u0935\u093F\u092D\u093E\u091C\u093F\u0924 \u0915\u0930\u0947\u0902\u0964
   - \u0907\u0915\u093E\u0908 (Units) \u0914\u0930 \u0906\u092F\u093E\u092E\u094B\u0902 (Dimensions) \u0915\u0940 \u0936\u0941\u0926\u094D\u0927\u0924\u093E \u0915\u0940 \u092A\u0941\u0937\u094D\u091F\u093F \u0915\u0930\u0947\u0902\u0964
3. **\u0938\u0924\u094D\u092F\u093E\u092A\u0928 (Verification)**: \u0905\u0902\u0924\u093F\u092E \u0909\u0924\u094D\u0924\u0930 \u0915\u0940 \u0924\u093E\u0930\u094D\u0915\u093F\u0915 \u0935\u094D\u092F\u093E\u0935\u0939\u093E\u0930\u093F\u0915\u0924\u093E \u0914\u0930 \u0938\u0940\u092E\u093E\u0913\u0902 \u0915\u0940 \u091C\u093E\u0902\u091A \u0915\u0930\u0947\u0902\u0964

---

### \u{1F30D} \u0935\u094D\u092F\u093E\u0935\u0939\u093E\u0930\u093F\u0915 \u0905\u0928\u0941\u092A\u094D\u0930\u092F\u094B\u0917 (Everyday Intuition)
> \u0938\u093F\u0926\u094D\u0927\u093E\u0902\u0924 \u0924\u092D\u0940 \u092F\u093E\u0926 \u0930\u0939\u0924\u093E \u0939\u0948 \u091C\u092C \u0939\u092E \u0909\u0938\u0947 \u0926\u0948\u0928\u093F\u0915 \u091C\u0940\u0935\u0928 \u0938\u0947 \u091C\u094B\u0921\u093C\u0924\u0947 \u0939\u0948\u0902\u0964 \u0909\u0926\u093E\u0939\u0930\u0923 \u0915\u0947 \u0932\u093F\u090F, \u0915\u093F\u0938\u0940 \u092D\u0940 \u092A\u094D\u0930\u0923\u093E\u0932\u0940 \u092E\u0947\u0902 \u0938\u0902\u0924\u0941\u0932\u0928 (Equilibrium) \u092C\u0928\u093E\u090F \u0930\u0916\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u0907\u0928\u092A\u0941\u091F \u0914\u0930 \u0906\u0909\u091F\u092A\u0941\u091F \u0915\u093E \u0938\u0902\u0930\u0915\u094D\u0937\u0923 \u0906\u0935\u0936\u094D\u092F\u0915 \u0939\u094B\u0924\u093E \u0939\u0948\u0964

---

### \u{1F4CC} \u092A\u0930\u0940\u0915\u094D\u0937\u093E \u0938\u092B\u0932\u0924\u093E \u0938\u0942\u0924\u094D\u0930 (Exam Revision Tips)
- \u{1F3AF} \u092A\u0930\u0940\u0915\u094D\u0937\u093E \u092E\u0947\u0902 \u092A\u0942\u0930\u0947 \u0905\u0902\u0915 \u092A\u094D\u0930\u093E\u092A\u094D\u0924 \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u092E\u0941\u0916\u094D\u092F \u0936\u092C\u094D\u0926\u094B\u0902 (Keywords) \u0915\u094B \u0905\u0902\u0921\u0930\u0932\u093E\u0907\u0928 \u0915\u0930\u0947\u0902\u0964
- \u{1F3AF} \u0938\u0942\u0924\u094D\u0930\u094B\u0902 \u0915\u094B \u0932\u093F\u0916\u0928\u0947 \u0915\u0947 \u092C\u093E\u0926 \u0939\u092E\u0947\u0936\u093E \u0905\u0902\u0924\u093F\u092E \u0909\u0924\u094D\u0924\u0930 \u0915\u094B \u092C\u0949\u0915\u094D\u0938 (Box) \u092E\u0947\u0902 \u092C\u0902\u0926 \u0915\u0930\u0947\u0902\u0964

---

### \u{1F9E0} \u0924\u094D\u0935\u0930\u093F\u0924 \u0905\u092D\u094D\u092F\u093E\u0938 (Quick Self-Check)
**\u092A\u094D\u0930\u0936\u094D\u0928**: \u0907\u0938 \u0905\u0935\u0927\u093E\u0930\u0923\u093E \u0915\u0947 \u0906\u0927\u093E\u0930 \u092A\u0930 \u090F\u0915 \u0935\u094D\u092F\u093E\u0935\u0939\u093E\u0930\u093F\u0915 \u0909\u0926\u093E\u0939\u0930\u0923 \u0905\u092A\u0928\u0940 \u0928\u094B\u091F\u092C\u0941\u0915 \u092E\u0947\u0902 \u0932\u093F\u0916\u0947\u0902 \u0914\u0930 \u092E\u0941\u0916\u094D\u092F \u0938\u0942\u0924\u094D\u0930 \u0915\u093E \u0905\u092D\u094D\u092F\u093E\u0938 \u0915\u0930\u0947\u0902!`;
    } else {
      output = `### \u{1F4A1} Executive Concept Overview: ${topicHeading}
${studentSalutation}Here is a structured, high-yield academic breakdown of this topic:

---

### \u{1F4D0} Step-by-Step Logic & Analytical Framework
1. **Core Foundation & Underlying Law**: Identify the primary governing law, theorem, or definitions associated with this topic.
2. **Systematic Problem Solving**:
   - Explicitly define given constraints, variables, and units.
   - Select the optimal formula or analytical model.
   - Compute intermediate steps systematically to prevent calculation drift.
3. **Boundary Condition & Unit Verification**: Ensure proper dimensional consistency and cross-verify with limiting cases.

---

### \u{1F30D} Real-World Analogy & Practical Intuition
> Abstract concepts are best retained when mapped to practical systems: think of dynamic equilibrium like a balanced water tank where the inflow rate equals the outflow rate!

---

### \u{1F4CC} High-Yield Exam Preparation Tips
- \u{1F3AF} Highlight key terms and always show step-by-step working to secure partial credit.
- \u{1F3AF} Box your final numerical or conceptual result with appropriate units.

---

### \u{1F9E0} Quick Self-Check Question
**Question**: What is the primary relationship between the independent and dependent variables in this concept? Try to formulate this in your study notes!`;
    }
  }
  if (isApiKeyIssue) {
    output += `

> \u{1F4A1} *Note: Rendered via the offline academic curriculum knowledge engine. You can configure your Gemini API key in AI Studio Settings to enable live generative queries.*`;
  }
  return output;
}
function generateSubjectMockQuestions(subject, topic, language = "en", requestedCount = 5) {
  const isHi = language === "hi";
  const cleanSubject = subject || "Science";
  const cleanTopic = topic || "Core Principles";
  const rawQuestions = isHi ? [
    {
      questionText: `${cleanSubject} \u092E\u0947\u0902 "${cleanTopic}" \u0915\u093E \u092E\u0941\u0916\u094D\u092F \u092E\u0942\u0932\u092D\u0942\u0924 \u0928\u093F\u092F\u092E \u0915\u094C\u0928 \u0938\u093E \u0939\u0948?`,
      correct: "\u0938\u0902\u0930\u0915\u094D\u0937\u0923 \u0914\u0930 \u0938\u0902\u0924\u0941\u0932\u0928 \u0915\u093E \u0928\u093F\u092F\u092E",
      distractors: [
        "\u092F\u093E\u0926\u0943\u091A\u094D\u091B\u093F\u0915 \u092A\u0930\u093F\u0935\u0930\u094D\u0924\u0928 \u0915\u093E \u0928\u093F\u092F\u092E",
        "\u0905\u0928\u093F\u0936\u094D\u091A\u093F\u0924\u0924\u093E \u0914\u0930 \u0935\u093F\u0938\u0902\u0917\u0924\u093F \u0915\u093E \u0928\u093F\u092F\u092E",
        "\u0936\u0942\u0928\u094D\u092F \u0926\u094D\u0930\u0935\u094D\u092F\u092E\u093E\u0928 \u0935 \u0905\u0938\u0940\u092E\u093F\u0924 \u090A\u0930\u094D\u091C\u093E \u0915\u093E \u0928\u093F\u092F\u092E"
      ],
      explanation: `"${cleanTopic}" \u0915\u0947 \u0938\u092D\u0940 \u092E\u093E\u0928\u0915 \u0938\u092E\u0940\u0915\u0930\u0923 \u0938\u0902\u0930\u0915\u094D\u0937\u0923 \u0914\u0930 \u092D\u094C\u0924\u093F\u0915-\u0917\u0923\u093F\u0924\u0940\u092F \u0938\u0902\u0924\u0941\u0932\u0928 \u0915\u0947 \u0928\u093F\u092F\u092E\u094B\u0902 \u092A\u0930 \u0906\u0927\u093E\u0930\u093F\u0924 \u0939\u094B\u0924\u0947 \u0939\u0948\u0902\u0964`
    },
    {
      questionText: `\u0926\u093F\u090F \u0917\u090F \u0935\u093F\u0915\u0932\u094D\u092A\u094B\u0902 \u092E\u0947\u0902 \u0938\u0947 "${cleanTopic}" \u0915\u0947 \u0938\u091F\u0940\u0915 \u0905\u0927\u094D\u092F\u092F\u0928 \u0915\u0947 \u0932\u093F\u090F \u0938\u092C\u0938\u0947 \u0906\u0935\u0936\u094D\u092F\u0915 \u091A\u0930 (Variable) \u0915\u094D\u092F\u093E \u0939\u0948?`,
      correct: "\u0938\u092E\u092F, \u0926\u0930 \u0914\u0930 \u092D\u094C\u0924\u093F\u0915 \u0915\u093E\u0930\u0915\u094B\u0902 \u092E\u0947\u0902 \u092A\u0930\u093F\u0935\u0930\u094D\u0924\u0928",
      distractors: [
        "\u0915\u0947\u0935\u0932 \u0935\u0938\u094D\u0924\u0941 \u0915\u093E \u092C\u093E\u0939\u094D\u092F \u0930\u0902\u0917 \u0914\u0930 \u0930\u0942\u092A",
        "\u0905\u092A\u0930\u093F\u0935\u0930\u094D\u0924\u0928\u0940\u092F \u0935 \u0938\u094D\u0925\u093F\u0930 \u0935\u093E\u0924\u093E\u0935\u0930\u0923",
        "\u092E\u0928\u092E\u093E\u0928\u093E \u0915\u093E\u0932\u094D\u092A\u0928\u093F\u0915 \u0905\u0928\u0941\u092E\u093E\u0928"
      ],
      explanation: "\u092A\u094D\u0930\u0915\u094D\u0930\u093F\u092F\u093E \u0915\u0940 \u0926\u0930, \u0938\u092E\u092F \u0914\u0930 \u092A\u094D\u0930\u093E\u0925\u092E\u093F\u0915 \u0918\u091F\u0915\u094B\u0902 \u0915\u093E \u092E\u093E\u0924\u094D\u0930\u093E\u0924\u094D\u092E\u0915 \u092E\u093E\u092A\u0928 \u0907\u0938 \u0935\u093F\u0937\u092F \u0915\u093E \u0906\u0927\u093E\u0930 \u0939\u0948\u0964"
    },
    {
      questionText: `"${cleanTopic}" \u0938\u0947 \u0938\u0902\u092C\u0902\u0927\u093F\u0924 \u0938\u0902\u0916\u094D\u092F\u093E\u0924\u094D\u092E\u0915 \u0917\u0923\u0928\u093E\u0913\u0902 \u092E\u0947\u0902 \u0915\u093F\u0938 \u092A\u0926\u094D\u0927\u0924\u093F \u0938\u0947 \u0924\u094D\u0930\u0941\u091F\u093F \u0915\u0940 \u0938\u0902\u092D\u093E\u0935\u0928\u093E \u0928\u094D\u092F\u0942\u0928\u0924\u092E \u0939\u094B\u0924\u0940 \u0939\u0948?`,
      correct: "\u091A\u0930\u0923\u092C\u0926\u094D\u0927 \u0935\u093F\u0927\u093F, \u0938\u0942\u0924\u094D\u0930 \u0938\u094D\u092A\u0937\u094D\u091F\u0924\u093E \u0914\u0930 \u0907\u0915\u093E\u0908 (Unit) \u0938\u0924\u094D\u092F\u093E\u092A\u0928",
      distractors: [
        "\u0905\u0902\u0924\u093F\u092E \u092A\u0930\u093F\u0923\u093E\u092E \u0915\u093E \u0924\u0941\u0915\u094D\u0915\u093E \u0932\u0917\u093E\u0928\u093E",
        "\u0907\u0915\u093E\u0907\u092F\u094B\u0902 \u0915\u094B \u0905\u0928\u0926\u0947\u0916\u093E \u0915\u0930\u0928\u093E",
        "\u0938\u0942\u0924\u094D\u0930\u094B\u0902 \u0914\u0930 \u0928\u093F\u092F\u092E\u094B\u0902 \u0915\u094B \u091B\u094B\u0921\u093C \u0926\u0947\u0928\u093E"
      ],
      explanation: "\u091A\u0930\u0923\u092C\u0926\u094D\u0927 \u0917\u0923\u0928\u093E, \u092E\u093E\u0928\u0915 \u0938\u0942\u0924\u094D\u0930\u094B\u0902 \u0915\u093E \u0909\u092A\u092F\u094B\u0917 \u0914\u0930 \u0907\u0915\u093E\u0907\u092F\u094B\u0902 \u0915\u093E \u0938\u0924\u094D\u092F\u093E\u092A\u0928 \u0938\u0939\u0940 \u0909\u0924\u094D\u0924\u0930 \u0938\u0941\u0928\u093F\u0936\u094D\u091A\u093F\u0924 \u0915\u0930\u0924\u093E \u0939\u0948\u0964"
    },
    {
      questionText: `\u0935\u094D\u092F\u093E\u0935\u0939\u093E\u0930\u093F\u0915 \u0930\u0942\u092A \u0938\u0947 "${cleanTopic}" \u0915\u093E \u0905\u0928\u0941\u092A\u094D\u0930\u092F\u094B\u0917 \u0935\u093E\u0938\u094D\u0924\u0935\u093F\u0915 \u0926\u0941\u0928\u093F\u092F\u093E \u092E\u0947\u0902 \u0915\u0939\u093E\u0901 \u0938\u0930\u094D\u0935\u093E\u0927\u093F\u0915 \u0926\u0947\u0916\u093E \u091C\u093E\u0924\u093E \u0939\u0948?`,
      correct: "\u0906\u0927\u0941\u0928\u093F\u0915 \u0907\u0902\u091C\u0940\u0928\u093F\u092F\u0930\u093F\u0902\u0917, \u0935\u0948\u091C\u094D\u091E\u093E\u0928\u093F\u0915 \u0938\u093F\u092E\u0941\u0932\u0947\u0936\u0928 \u090F\u0935\u0902 \u0924\u0915\u0928\u0940\u0915\u0940 \u092A\u094D\u0930\u0923\u093E\u0932\u093F\u092F\u094B\u0902 \u092E\u0947\u0902",
      distractors: [
        "\u0915\u0947\u0935\u0932 \u0915\u093E\u0932\u094D\u092A\u0928\u093F\u0915 \u0915\u093F\u0924\u093E\u092C\u094B\u0902 \u092E\u0947\u0902",
        "\u0915\u093F\u0938\u0940 \u092D\u0940 \u092A\u094D\u0930\u093E\u092F\u094B\u0917\u093F\u0915 \u0915\u093E\u0930\u094D\u092F \u092E\u0947\u0902 \u0928\u0939\u0940\u0902",
        "\u0905\u091C\u094D\u091E\u093E\u0924 \u0935 \u0905\u0935\u094D\u092F\u093E\u0935\u0939\u093E\u0930\u093F\u0915 \u0915\u094D\u0937\u0947\u0924\u094D\u0930\u094B\u0902 \u092E\u0947\u0902"
      ],
      explanation: "\u092F\u0939 \u0938\u093F\u0926\u094D\u0927\u093E\u0902\u0924 \u0906\u0927\u0941\u0928\u093F\u0915 \u0914\u0926\u094D\u092F\u094B\u0917\u093F\u0915 \u0924\u0915\u0928\u0940\u0915\u094B\u0902 \u0914\u0930 \u0935\u093E\u0938\u094D\u0924\u0935\u093F\u0915 \u0935\u0948\u091C\u094D\u091E\u093E\u0928\u093F\u0915 \u0905\u0928\u0941\u0938\u0902\u0927\u093E\u0928 \u092E\u0947\u0902 \u0935\u094D\u092F\u093E\u092A\u0915 \u0930\u0942\u092A \u0938\u0947 \u092A\u094D\u0930\u092F\u0941\u0915\u094D\u0924 \u0939\u094B\u0924\u093E \u0939\u0948\u0964"
    },
    {
      questionText: `"${cleanTopic}" \u0915\u0947 \u0917\u0939\u0928 \u0905\u0927\u094D\u092F\u092F\u0928 \u0938\u0947 \u0935\u093F\u0926\u094D\u092F\u093E\u0930\u094D\u0925\u0940 \u092E\u0947\u0902 \u0915\u093F\u0938 \u092E\u0941\u0916\u094D\u092F \u0915\u094D\u0937\u092E\u0924\u093E \u0915\u093E \u0935\u093F\u0915\u093E\u0938 \u0939\u094B\u0924\u093E \u0939\u0948?`,
      correct: "\u0924\u093E\u0930\u094D\u0915\u093F\u0915, \u0935\u093F\u0936\u094D\u0932\u0947\u0937\u0923\u093E\u0924\u094D\u092E\u0915 \u090F\u0935\u0902 \u0938\u092E\u0938\u094D\u092F\u093E-\u0938\u092E\u093E\u0927\u093E\u0928 \u091A\u093F\u0902\u0924\u0928",
      distractors: [
        "\u092C\u093F\u0928\u093E \u0938\u092E\u091D\u0947 \u0915\u0947\u0935\u0932 \u0930\u091F\u0928\u093E",
        "\u0924\u094D\u0930\u0941\u091F\u093F\u092A\u0942\u0930\u094D\u0923 \u0928\u093F\u0937\u094D\u0915\u0930\u094D\u0937 \u0928\u093F\u0915\u093E\u0932\u0928\u093E",
        "\u0938\u092E\u092F \u0935 \u090F\u0915\u093E\u0917\u094D\u0930\u0924\u093E \u0915\u093E \u0939\u094D\u0930\u093E\u0938"
      ],
      explanation: "\u0935\u0948\u091C\u094D\u091E\u093E\u0928\u093F\u0915 \u0914\u0930 \u0917\u0923\u093F\u0924\u0940\u092F \u0926\u0943\u0937\u094D\u091F\u093F\u0915\u094B\u0923 \u0938\u0947 \u0938\u092E\u0938\u094D\u092F\u093E\u0913\u0902 \u0915\u093E \u0938\u091F\u0940\u0915 \u0935\u093F\u0936\u094D\u0932\u0947\u0937\u0923 \u0915\u0930\u0928\u0947 \u0915\u0940 \u0915\u094D\u0937\u092E\u0924\u093E \u0935\u093F\u0915\u0938\u093F\u0924 \u0939\u094B\u0924\u0940 \u0939\u0948\u0964"
    },
    {
      questionText: `"${cleanTopic}" \u0915\u0940 \u0915\u093F\u0938\u0940 \u0938\u092E\u0938\u094D\u092F\u093E \u0915\u094B \u0939\u0932 \u0915\u0930\u0924\u0947 \u0938\u092E\u092F \u092A\u0939\u0932\u093E \u0905\u0928\u093F\u0935\u093E\u0930\u094D\u092F \u091A\u0930\u0923 \u0915\u094D\u092F\u093E \u0939\u094B\u0928\u093E \u091A\u093E\u0939\u093F\u090F?`,
      correct: "\u0926\u093F\u090F \u0917\u090F \u0921\u0947\u091F\u093E (Given Data) \u0915\u094B \u091A\u093F\u0928\u094D\u0939\u093F\u0924 \u0915\u0930 \u0909\u092A\u092F\u0941\u0915\u094D\u0924 \u0938\u0942\u0924\u094D\u0930 \u091A\u0941\u0928\u0928\u093E",
      distractors: [
        "\u0938\u0940\u0927\u0947 \u0905\u0902\u0924\u093F\u092E \u0909\u0924\u094D\u0924\u0930 \u0932\u093F\u0916\u0928\u093E",
        "\u092A\u094D\u0930\u0936\u094D\u0928 \u0915\u0940 \u0936\u0930\u094D\u0924\u094B\u0902 \u0915\u094B \u0905\u0928\u0926\u0947\u0916\u093E \u0915\u0930\u0928\u093E",
        "\u0915\u0948\u0932\u0915\u0941\u0932\u0947\u0936\u0928 \u092C\u0940\u091A \u092E\u0947\u0902 \u091B\u094B\u0921\u093C \u0926\u0947\u0928\u093E"
      ],
      explanation: "\u0938\u092E\u0938\u094D\u092F\u093E \u0915\u093E \u0935\u093F\u0936\u094D\u0932\u0947\u0937\u0923 \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u0938\u0930\u094D\u0935\u092A\u094D\u0930\u0925\u092E \u0926\u093F\u090F \u0917\u090F \u0906\u0902\u0915\u095C\u094B\u0902 \u0915\u094B \u0938\u0942\u091A\u0940\u092C\u0926\u094D\u0927 \u0915\u0930\u0928\u093E \u0938\u0930\u094D\u0935\u094B\u0924\u094D\u0924\u092E \u0935\u0948\u091C\u094D\u091E\u093E\u0928\u093F\u0915 \u0924\u0930\u0940\u0915\u093E \u0939\u0948\u0964"
    },
    {
      questionText: `\u092F\u0926\u093F "${cleanTopic}" \u092E\u0947\u0902 \u092E\u0941\u0916\u094D\u092F \u092A\u0948\u0930\u093E\u092E\u0940\u091F\u0930\u094D\u0938 \u0915\u094B \u0926\u094B\u0917\u0941\u0928\u093E \u0915\u0930 \u0926\u093F\u092F\u093E \u091C\u093E\u090F, \u0924\u094B \u0938\u093E\u092E\u093E\u0928\u094D\u092F\u0924\u0903 \u092A\u094D\u0930\u0923\u093E\u0932\u0940 \u092A\u0930 \u0915\u094D\u092F\u093E \u092A\u094D\u0930\u092D\u093E\u0935 \u092A\u0921\u093C\u0947\u0917\u093E?`,
      correct: "\u0936\u093E\u0938\u0940 \u0938\u092E\u0940\u0915\u0930\u0923 \u0915\u0947 \u0905\u0928\u0941\u092A\u093E\u0924\u093F\u0915 \u092F\u093E \u0935\u094D\u092F\u0941\u0924\u094D\u0915\u094D\u0930\u092E\u093E\u0928\u0941\u092A\u093E\u0924\u0940 \u0928\u093F\u092F\u092E\u093E\u0928\u0941\u0938\u093E\u0930 \u092A\u0930\u093F\u0935\u0930\u094D\u0924\u0928 \u0939\u094B\u0917\u093E",
      distractors: [
        "\u0915\u094B\u0908 \u092D\u0940 \u092A\u094D\u0930\u092D\u093E\u0935 \u0928\u0939\u0940\u0902 \u092A\u0921\u093C\u0947\u0917\u093E",
        "\u092A\u094D\u0930\u0923\u093E\u0932\u0940 \u0924\u0941\u0930\u0902\u0924 \u0928\u0937\u094D\u091F \u0939\u094B \u091C\u093E\u090F\u0917\u0940",
        "\u0905\u092A\u0930\u093F\u092E\u093F\u0924 \u0930\u0942\u092A \u0938\u0947 \u0905\u0928\u093F\u092F\u092E\u093F\u0924 \u0935\u094D\u092F\u0935\u0939\u093E\u0930 \u0939\u094B\u0917\u093E"
      ],
      explanation: "\u092A\u094D\u0930\u0924\u094D\u092F\u0947\u0915 \u0935\u0948\u091C\u094D\u091E\u093E\u0928\u093F\u0915 \u0938\u093F\u0926\u094D\u0927\u093E\u0902\u0924 \u092E\u0947\u0902 \u0930\u093E\u0936\u093F\u092F\u094B\u0902 \u0915\u0947 \u092C\u0940\u091A \u090F\u0915 \u092A\u0942\u0930\u094D\u0935-\u0928\u093F\u0930\u094D\u0927\u093E\u0930\u093F\u0924 \u0917\u0923\u093F\u0924\u0940\u092F \u0938\u0902\u092C\u0902\u0927 \u0939\u094B\u0924\u093E \u0939\u0948\u0964"
    },
    {
      questionText: `\u092A\u0930\u0940\u0915\u094D\u0937\u093E \u092E\u0947\u0902 "${cleanTopic}" \u0938\u0947 \u0938\u0902\u092C\u0902\u0927\u093F\u0924 \u092A\u094D\u0930\u0936\u094D\u0928\u094B\u0902 \u092E\u0947\u0902 \u092A\u0942\u0930\u0947 \u0905\u0902\u0915 \u092A\u094D\u0930\u093E\u092A\u094D\u0924 \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u0915\u094D\u092F\u093E \u0906\u0935\u0936\u094D\u092F\u0915 \u0939\u0948?`,
      correct: "\u0938\u0942\u0924\u094D\u0930, \u091A\u0930\u0923\u092C\u0926\u094D\u0927 \u0939\u0932, \u0907\u0915\u093E\u0907\u092F\u093E\u0901 \u0914\u0930 \u0905\u0902\u0924\u093F\u092E \u0909\u0924\u094D\u0924\u0930 \u0915\u094B \u092C\u0949\u0915\u094D\u0938 \u092E\u0947\u0902 \u0938\u094D\u092A\u0937\u094D\u091F \u0932\u093F\u0916\u0928\u093E",
      distractors: [
        "\u0915\u0947\u0935\u0932 \u092C\u093F\u0928\u093E \u0917\u0923\u0928\u093E \u0915\u0947 \u0909\u0924\u094D\u0924\u0930 \u0932\u093F\u0916\u0928\u093E",
        "\u0905\u0938\u094D\u092A\u0937\u094D\u091F \u0932\u093F\u0916\u093E\u0935\u091F \u0914\u0930 \u0938\u0942\u0924\u094D\u0930 \u091B\u094B\u0921\u093C\u0928\u093E",
        "\u0917\u0932\u0924 \u0907\u0915\u093E\u0908 \u0915\u0947 \u0938\u093E\u0925 \u092E\u093E\u0928 \u0932\u093F\u0916\u0928\u093E"
      ],
      explanation: "\u092E\u0942\u0932\u094D\u092F\u093E\u0902\u0915\u0928\u0915\u0930\u094D\u0924\u093E \u091A\u0930\u0923\u092C\u0926\u094D\u0927 \u0924\u093E\u0930\u094D\u0915\u093F\u0915 \u092A\u094D\u0930\u0935\u093E\u0939 \u0914\u0930 \u0938\u094D\u092A\u0937\u094D\u091F \u0909\u0924\u094D\u0924\u0930 \u092A\u094D\u0930\u0938\u094D\u0924\u0941\u0924\u093F \u092A\u0930 \u092A\u0942\u0930\u094D\u0923 \u0905\u0902\u0915 \u092A\u094D\u0930\u0926\u093E\u0928 \u0915\u0930\u0924\u0947 \u0939\u0948\u0902\u0964"
    }
  ] : [
    {
      questionText: `What is the primary governing principle of "${cleanTopic}" in ${cleanSubject}?`,
      correct: "Conservation Laws and Dynamic Equilibrium",
      distractors: [
        "Random Fluctuations Principle",
        "Arbitrary Static Hypothesis",
        "Non-interacting Field Conjecture"
      ],
      explanation: `Foundational mechanisms of "${cleanTopic}" strictly adhere to conservation and mathematical equilibrium principles.`
    },
    {
      questionText: `When analyzing complex problem scenarios involving "${cleanTopic}", which step is considered essential?`,
      correct: "Verifying boundary conditions, formula applicability, and dimensional units",
      distractors: [
        "Relying purely on qualitative approximations without calculation",
        "Assuming zero initial states unconditionally",
        "Omitting intermediate analytical steps"
      ],
      explanation: "Dimensional consistency, explicit formula choice, and boundary checks ensure scientific validity."
    },
    {
      questionText: `How does a structured change in primary parameters typically influence "${cleanTopic}"?`,
      correct: "Follows a predictable, mathematically governed relationship",
      distractors: [
        "Causes purely chaotic, untestable variations",
        "Has absolutely no measurable physical or numerical effect",
        "Violates fundamental conservation principles"
      ],
      explanation: "Governing equations demonstrate direct or inverse relationships under specified physical constraints."
    },
    {
      questionText: `In standard competitive examinations, which practice guarantees top scoring on "${cleanTopic}"?`,
      correct: "Presenting sequential step derivations with explicit formulas and units",
      distractors: [
        "Writing only the final value without any supporting steps",
        "Skipping dimensional annotations and units",
        "Omitting necessary reference diagrams"
      ],
      explanation: "Examiners award marks for systematic methodology, formula clarity, and boxed final answers."
    },
    {
      questionText: `Which practical application best showcases the real-world utility of "${cleanTopic}"?`,
      correct: "System optimization, computational modeling, and industrial technology",
      distractors: [
        "Purely historical archival documentation",
        "Uncalibrated subjective observation",
        "Isolated abstract exercises with zero physical counterpart"
      ],
      explanation: "Modern engineering, computation, and scientific instruments rely heavily on these core principles."
    },
    {
      questionText: `What is the most effective approach for mastering difficult concepts in "${cleanTopic}"?`,
      correct: "Active problem-solving and connecting principles to real-world analogies",
      distractors: [
        "Passive rereading without solving practice questions",
        "Memorizing formulas without understanding derivations",
        "Avoiding analytical practice problems"
      ],
      explanation: "Active recall combined with rigorous question practice produces deep conceptual retention."
    },
    {
      questionText: `What role do fundamental assumptions play in the theoretical framework of "${cleanTopic}"?`,
      correct: "They establish valid boundary domains within which formulas hold true",
      distractors: [
        "They make the theory invalid for any real application",
        "They introduce uncontrolled mathematical errors",
        "They are completely arbitrary with no scientific basis"
      ],
      explanation: "Every scientific and mathematical model is formulated under well-defined boundary assumptions."
    },
    {
      questionText: `When cross-checking a solution in "${cleanTopic}", which method provides immediate verification?`,
      correct: "Dimensional analysis and testing limiting or extreme cases",
      distractors: [
        "Guessing whether the number looks reasonable",
        "Changing the formula midway",
        "Ignoring orders of magnitude"
      ],
      explanation: "Dimensional consistency checks and extreme condition testing immediately expose mathematical flaws."
    }
  ];
  const countToReturn = Math.max(3, Math.min(requestedCount, 30));
  const selectedPool = [];
  for (let i = 0; i < countToReturn; i++) {
    selectedPool.push(rawQuestions[i % rawQuestions.length]);
  }
  return selectedPool.map((item, idx) => {
    const allOptions = [item.correct, ...item.distractors];
    for (let j = allOptions.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [allOptions[j], allOptions[k]] = [allOptions[k], allOptions[j]];
    }
    const correctIndex = allOptions.indexOf(item.correct);
    return {
      questionText: `${item.questionText}${idx >= rawQuestions.length ? ` (Variation ${Math.floor(idx / rawQuestions.length) + 1})` : ""}`,
      options: allOptions,
      correctOptionIndex: correctIndex >= 0 ? correctIndex : 0,
      explanation: item.explanation
    };
  });
}
function checkCreatorQuestion(prompt, language = "English") {
  if (!prompt) return null;
  let cleaned = prompt;
  cleaned = cleaned.replace(/\[Attached Document:[\s\S]*?\[Use the above attached document context to address the prompt below accurately\.\]/gi, "");
  cleaned = cleaned.replace(/\[[\s\S]*?\]/g, "");
  cleaned = cleaned.replace(/Provide a strict step-by-step solution for[^:]*:/gi, "");
  cleaned = cleaned.replace(/Explain clearly with analogies suitable for[^:]*:/gi, "");
  cleaned = cleaned.replace(/Generate a 3-question practice quiz suitable for[^:]*:/gi, "");
  const norm = cleaned.toLowerCase().trim();
  const isHi = language === "Hindi" || language === "hi" || norm.includes("hindi") || norm.includes("\u0939\u093F\u0928\u094D\u0926\u0940") || norm.includes("\u0939\u093F\u0902\u0926\u0940");
  const isHinglish = language === "Hinglish" || language === "Mixed" || norm.includes("hinglish");
  const mentionsRohitDirectly = norm.includes("rohit") || norm.includes("yadav") || norm.includes("\u0930\u094B\u0939\u093F\u0924") || norm.includes("\u092F\u093E\u0926\u0935");
  const hasCreatorTerm = norm.includes("creator") || norm.includes("developer") || norm.includes("maker") || norm.includes("owner") || norm.includes("founder") || norm.includes("ceo") || norm.includes("malik") || norm.includes("\u092E\u093E\u0932\u093F\u0915") || norm.includes("\u092C\u0928\u093E\u092F\u093E") || norm.includes("banya") || norm.includes("boss") || norm.includes("owner");
  const refersToYou = norm.includes("you") || norm.includes("your") || norm.includes("yourself") || norm.includes(" u ") || norm.includes(" ur ") || norm.includes("tutor") || norm.includes("buddy") || norm.includes("app") || norm.includes("ai") || norm.includes("bot") || norm.includes("website") || norm.includes("tool") || norm.includes("software") || norm.includes("system") || norm.includes("application") || norm.includes("tumhe") || norm.includes("aapko") || norm.includes("tujhe") || norm.includes("is app") || norm.includes("is ai") || norm.includes("is bot") || norm.includes("apko") || norm.includes("tumhe");
  const asksWhoMade = norm.includes("who made") || norm.includes("who created") || norm.includes("who built") || norm.includes("who designed") || norm.includes("who developed") || norm.includes("who owns") || norm.includes("kisne banaya") || norm.includes("kaun banaya") || norm.includes("kisne design") || norm.includes("kisne develop") || norm.includes("kisne code") || norm.includes("kisne banaya hai") || norm.includes("kaun banaya hai") || norm === "\u0924\u0941\u092E\u094D\u0939\u0947\u0902 \u0915\u093F\u0938\u0928\u0947 \u092C\u0928\u093E\u092F\u093E?" || norm === "\u0924\u0941\u092E\u094D\u0939\u0947\u0902 \u0915\u093F\u0938\u0928\u0947 \u092C\u0928\u093E\u092F\u093E" || norm === "creator \u0915\u094C\u0928 \u0939\u0948" || norm === "creator \u0915\u094C\u0928 \u0939\u0948?" || norm.includes("kisne design") || norm.includes("who is founder") || norm.includes("who is ceo") || norm.includes("who is owner") || norm.includes("malik kaun") || norm.includes("kisne banya") || norm.includes("owner kaun");
  let isAboutCreator = false;
  if (mentionsRohitDirectly) {
    const generalGreetings = ["hi", "hello", "hey", "hola", "namaste", "pranam", "sup", "yo", "\u0939\u093E\u092F", "\u0928\u092E\u0938\u094D\u0924\u0947", "\u0939\u0947\u0932\u094B"];
    const isJustGreeting = generalGreetings.includes(norm);
    if (!isJustGreeting) {
      isAboutCreator = true;
    }
  } else if (hasCreatorTerm && refersToYou) {
    isAboutCreator = true;
  } else if (asksWhoMade && refersToYou) {
    isAboutCreator = true;
  } else if ((hasCreatorTerm || asksWhoMade) && norm.length < 35) {
    isAboutCreator = true;
  }
  if (isAboutCreator && !mentionsRohitDirectly) {
    const academicSubjects = [
      "motion",
      "gravity",
      "universe",
      "world",
      "earth",
      "country",
      "india",
      "car",
      "concept",
      "theory",
      "formula",
      "laws",
      "law",
      "cell",
      "biology",
      "physics",
      "chemistry",
      "periodic",
      "table",
      "element",
      "atom",
      "molecule",
      "science",
      "math",
      "calculus",
      "derivative",
      "integral",
      "equation",
      "history",
      "war",
      "book",
      "author",
      "play",
      "movie",
      "song",
      "language",
      "grammar",
      "sentence",
      "word",
      "code",
      "programming",
      "python",
      "javascript",
      "react",
      "html",
      "css",
      "computer",
      "internet",
      "google",
      "facebook",
      "microsoft",
      "apple",
      "tesla",
      "spacex",
      "amazon",
      "netflix",
      "twitter",
      "electricity",
      "magnet",
      "sound",
      "light",
      "energy",
      "work",
      "power",
      "speed",
      "velocity",
      "acceleration",
      "force",
      "mass",
      "weight",
      "friction",
      "heat",
      "temperature",
      "pressure",
      "density",
      "volume",
      "area",
      "length",
      "time",
      "distance",
      "displacement",
      "vector",
      "scalar",
      "newton",
      "galileo",
      "einstein",
      "darwin",
      "mendel",
      "pasteur",
      "curie",
      "tesla",
      "edison",
      "bell",
      "bohr",
      "rutheford",
      "dalton",
      "avogadro",
      "boyle",
      "charles",
      "gay-lussac",
      "dalton",
      "graham",
      "henry",
      "raoult",
      "faraday",
      "ampere",
      "volt",
      "ohm",
      "joule",
      "watt",
      "hertz"
    ];
    const hasAcademicSubject = academicSubjects.some((sub) => norm.includes(sub));
    if (hasAcademicSubject) {
      isAboutCreator = false;
    }
  }
  if (!isAboutCreator) {
    return null;
  }
  const matchCreatorSimple = norm.includes("who") && (norm.includes("created") || norm.includes("made") || norm.includes("built") || norm.includes("designed") || norm.includes("developed")) && norm.includes("you") || norm.includes("kisne") && (norm.includes("banaya") || norm.includes("banya") || norm.includes("design") || norm.includes("develop")) && (norm.includes("tumhe") || norm.includes("tujhe") || norm.includes("aapko") || norm.includes("you") || norm.includes("ai")) || norm.includes("kaun") && norm.includes("banaya") && (norm.includes("tumhe") || norm.includes("aapko") || norm.includes("app") || norm.includes("tutor")) || norm.includes("who is") && norm.includes("creator") && (norm.includes("your") || norm.includes("app") || norm.includes("ai")) || norm.includes("creator") && (norm.includes("who") || norm.includes("kisne")) && (norm.includes("you") || norm.includes("tutor") || norm.includes("study buddy")) || norm.includes("app") && norm.includes("kisne") && norm.includes("banaya") || (norm.includes("malik") || norm.includes("owner") || norm.includes("founder") || norm.includes("ceo")) || (norm === "creator \u0915\u094C\u0928 \u0939\u0948" || norm === "creator \u0915\u094C\u0928 \u0939\u0948?" || norm === "\u0924\u0941\u092E\u094D\u0939\u0947\u0902 \u0915\u093F\u0938\u0928\u0947 \u092C\u0928\u093E\u092F\u093E?" || norm === "\u0924\u0941\u092E\u094D\u0939\u0947\u0902 \u0915\u093F\u0938\u0928\u0947 \u092C\u0928\u093E\u092F\u093E");
  const hasAge = norm.includes("age") || norm.includes("umar") || norm.includes("saal") || norm.includes("old") || norm.includes("\u0909\u092E\u094D\u0930");
  const hasWhere = norm.includes("where") || norm.includes("kahan") || norm.includes("location") || norm.includes("city") || norm.includes("address") || norm.includes("shehar") || norm.includes("gaon") || norm.includes("from") || norm.includes("\u0930\u0939\u0924\u0947") || norm.includes("\u0915\u0939\u093E\u0901") || norm.includes("\u0930\u0939\u0924\u093E") || norm.includes("\u0930\u0939\u0924\u0940");
  const hasSchool = norm.includes("school") || norm.includes("college") || norm.includes("padhta") || norm.includes("padhti") || norm.includes("study") || norm.includes("education") || norm.includes("class") || norm.includes("grade") || norm.includes("pcm") || norm.includes("\u0938\u094D\u0915\u0942\u0932") || norm.includes("\u0915\u094D\u0932\u093E\u0938") || norm.includes("\u092A\u0922\u093C\u0924\u0947");
  const hasGithub = norm.includes("github") || norm.includes("portfolio") || norm.includes("link") || norm.includes("git");
  const hasProjects = norm.includes("project") || norm.includes("built") || norm.includes("banaya") || norm.includes("product") || norm.includes("apps") || norm.includes("\u092C\u0928\u093E\u092F\u093E") || norm.includes("\u092A\u094D\u0930\u094B\u091C\u0947\u0915\u094D\u091F");
  const hasInterests = norm.includes("interest") || norm.includes("hobby") || norm.includes("hobbies") || norm.includes("sports") || norm.includes("cricket") || norm.includes("astronomy") || norm.includes("pasand") || norm.includes("\u0930\u0941\u091A\u093F") || norm.includes("\u0915\u094D\u0930\u093F\u0915\u0947\u091F") || norm.includes("\u092A\u0938\u0902\u0926");
  const hasSkills = norm.includes("skills") || norm.includes("tech") || norm.includes("python") || norm.includes("react") || norm.includes("languages") || norm.includes("\u0915\u094C\u0936\u0932") || norm.includes("\u0924\u0915\u0928\u0940\u0915\u0940");
  if (hasAge) {
    if (isHi || isHinglish) {
      return "\u092E\u0947\u0930\u0947 Creator Profile \u092E\u0947\u0902 **\u0909\u092E\u094D\u0930 (Age)** \u0915\u0940 \u091C\u093E\u0928\u0915\u093E\u0930\u0940 \u0915\u093E \u0909\u0932\u094D\u0932\u0947\u0916 \u0928\u0939\u0940\u0902 \u0939\u0948\u0964";
    }
    return "My Creator Profile does not mention his **age**.";
  }
  if (hasWhere) {
    if (isHi) {
      return "\u0930\u094B\u0939\u093F\u0924 \u092F\u093E\u0926\u0935 **\u092E\u0939\u0947\u0936\u092A\u0941\u0930, \u091B\u092C\u0921\u093C\u093E \u0924\u0939\u0938\u0940\u0932, \u092C\u093E\u0930\u093E\u0902 \u091C\u093F\u0932\u093E, \u0930\u093E\u091C\u0938\u094D\u0925\u093E\u0928, \u092D\u093E\u0930\u0924** \u0915\u0947 \u0930\u0939\u0928\u0947 \u0935\u093E\u0932\u0947 \u0939\u0948\u0902\u0964";
    } else if (isHinglish) {
      return "Rohit Yadav **Maheshpur, Chhabra Tehsil, Baran District, Rajasthan, India** ke rehne wale hain.";
    } else {
      return "Rohit Yadav belongs to **Maheshpur, Chhabra Tehsil, Baran District, Rajasthan, India**.";
    }
  }
  if (hasSchool) {
    if (isHi) {
      return "\u0930\u094B\u0939\u093F\u0924 **\u0938\u094D\u0935\u093E\u092E\u0940 \u0935\u093F\u0935\u0947\u0915\u093E\u0928\u0902\u0926 \u0917\u0935\u0930\u094D\u0928\u092E\u0947\u0902\u091F \u092E\u0949\u0921\u0932 \u0938\u094D\u0915\u0942\u0932, \u0915\u0921\u093C\u0948\u092F\u093E\u092C\u0928, \u091B\u092C\u0921\u093C\u093E, \u0930\u093E\u091C\u0938\u094D\u0925\u093E\u0928** \u092E\u0947\u0902 Class 12 Science (PCM) \u0915\u0947 \u091B\u093E\u0924\u094D\u0930 \u0939\u0948\u0902 \u0914\u0930 **Arjuna JEE 3.0** \u092C\u0948\u091A \u092E\u0947\u0902 \u0928\u093E\u092E\u093E\u0902\u0915\u093F\u0924 \u0939\u0948\u0902\u0964";
    } else if (isHinglish) {
      return "Rohit **Swami Vivekanand Government Model School, Kadaiyaban, Chhabra, Rajasthan** me Class 12 Science (PCM) ke student hain aur unhone **Arjuna JEE 3.0** join kiya hua hai.";
    } else {
      return "Rohit is a Class 12 Science (PCM) student at **Swami Vivekanand Government Model School, Kadaiyaban, Chhabra, Rajasthan**, and is enrolled in **Arjuna JEE 3.0**.";
    }
  }
  if (hasGithub) {
    if (isHi || isHinglish) {
      return "\u0930\u094B\u0939\u093F\u0924 \u092F\u093E\u0926\u0935 \u0915\u093E GitHub \u092A\u094B\u0930\u094D\u091F\u092B\u094B\u0932\u093F\u092F\u094B \u0932\u093F\u0902\u0915 \u092F\u0939 \u0939\u0948: [heenayadav325200-png](https://github.com/heenayadav325200-png)";
    }
    return "You can check out Rohit Yadav's GitHub portfolio here: [heenayadav325200-png](https://github.com/heenayadav325200-png)";
  }
  if (hasProjects) {
    if (isHi) {
      return "\u0930\u094B\u0939\u093F\u0924 \u092F\u093E\u0926\u0935 \u0928\u0947 \u0915\u0908 \u092C\u0947\u0939\u0924\u0930\u0940\u0928 \u092A\u094D\u0930\u094B\u091C\u0947\u0915\u094D\u091F\u094D\u0938 \u092C\u0928\u093E\u090F \u0939\u0948\u0902:\n1. **Sathi AI**: \u0915\u0938\u094D\u091F\u092E-\u092A\u094D\u0930\u0936\u093F\u0915\u094D\u0937\u093F\u0924 8B GGUF \u092D\u093E\u0937\u093E \u092E\u0949\u0921\u0932\u0964\n2. **Ascend Study**: \u0938\u0941\u0935\u094D\u092F\u0935\u0938\u094D\u0925\u093F\u0924 \u090F\u091C\u0941\u0915\u0947\u0936\u0928\u0932 \u0935\u0947\u092C \u090F\u092A\u094D\u0932\u0940\u0915\u0947\u0936\u0928\u0964\n3. **CORE AI**: \u090F\u0906\u0908 \u0905\u0938\u093F\u0938\u094D\u091F\u0947\u0902\u091F \u0907\u0902\u091F\u0930\u092B\u093C\u0947\u0938\u0964\n4. **PocketPaisa / PocketPaisa Pro**: \u0935\u093F\u0924\u094D\u0924\u0940\u092F \u092A\u094D\u0930\u092C\u0902\u0927\u0928 \u0935\u0947\u092C \u0910\u092A\u0964\n5. **DriveMate AI**: \u0938\u0921\u093C\u0915 \u0938\u0941\u0930\u0915\u094D\u0937\u093E \u0921\u094D\u0930\u093E\u0907\u0935\u093F\u0902\u0917 \u0905\u0938\u093F\u0938\u094D\u091F\u0947\u0902\u091F\u0964\n6. **THERMONEST V1**: \u0917\u0948\u0930-\u0935\u093F\u0926\u094D\u092F\u0941\u0924 \u0935\u093E\u0937\u094D\u092A\u0940\u0915\u0930\u0923\u0940\u092F \u0915\u0942\u0932\u093F\u0902\u0917 \u0938\u093F\u0938\u094D\u091F\u092E \u092C\u094D\u0932\u0942\u092A\u094D\u0930\u093F\u0902\u091F\u0964";
    } else if (isHinglish) {
      return "Rohit Yadav ne kai real-world projects banaye hain:\n1. **Sathi AI**: Custom-trained 8B GGUF language model.\n2. **Ascend Study**: Educational web application.\n3. **CORE AI**: Custom conversational AI assistant interface.\n4. **PocketPaisa / PocketPaisa Pro**: Expense tracking app.\n5. **DriveMate AI**: Intelligent driving assistant concept.\n6. **THERMONEST V1**: Sustainable cooling system technical blueprint.";
    } else {
      return "Rohit Yadav has engineered several key projects:\n1. **Sathi AI**: Custom-trained 8B GGUF language model.\n2. **Ascend Study**: Educational web application.\n3. **CORE AI**: AI assistant interface.\n4. **PocketPaisa**: Finance management web app.\n5. **DriveMate AI**: Road safety driving assistant.\n6. **THERMONEST V1**: Sustainable pre-cooling system technical blueprint.";
    }
  }
  if (hasInterests) {
    if (isHi) {
      return "\u0930\u094B\u0939\u093F\u0924 \u092F\u093E\u0926\u0935 \u0915\u0940 \u0935\u093F\u091C\u094D\u091E\u093E\u0928 \u0914\u0930 \u0916\u0947\u0932\u094B\u0902 \u092E\u0947\u0902 \u0917\u0939\u0930\u0940 \u0930\u0941\u091A\u093F \u0939\u0948:\n* **\u0916\u0917\u094B\u0932 \u0935\u093F\u091C\u094D\u091E\u093E\u0928 (Astronomy)**: \u091B\u0924 \u0938\u0947 \u0906\u0915\u093E\u0936\u0940\u092F \u092A\u093F\u0902\u0921\u094B\u0902 (\u092C\u0943\u0939\u0938\u094D\u092A\u0924\u093F, \u0913\u0930\u093F\u092F\u0928 \u0928\u0915\u094D\u0937\u0924\u094D\u0930, \u090F\u0902\u0921\u094D\u0930\u094B\u092E\u0947\u0921\u093E \u0917\u0948\u0932\u0947\u0915\u094D\u0938\u0940) \u0915\u093E \u0905\u0935\u0932\u094B\u0915\u0928 \u0915\u0930\u0928\u093E \u0914\u0930 \u091C\u0942\u0928\u093F\u0935\u0930\u094D\u0938 (Zooniverse) \u092A\u0930 \u0916\u0917\u094B\u0932\u0940\u092F \u0921\u0947\u091F\u093E \u0935\u0930\u094D\u0917\u0940\u0915\u0930\u0923 \u0915\u093E\u0930\u094D\u092F\u094B\u0902 \u092E\u0947\u0902 \u092D\u093E\u0917 \u0932\u0947\u0928\u093E\u0964\n* **\u0916\u0947\u0932 (Sports)**: \u090F\u0915 \u0909\u0924\u094D\u0938\u093E\u0939\u0940 \u0915\u094D\u0930\u093F\u0915\u0947\u091F\u0930, \u091C\u094B \u0926\u093E\u090F\u0902 \u0939\u093E\u0925 \u0915\u0947 \u092C\u0932\u094D\u0932\u0947\u092C\u093E\u091C \u0914\u0930 \u0924\u0947\u091C \u0917\u0947\u0902\u0926\u092C\u093E\u091C \u0939\u0948\u0902\u0964";
    } else if (isHinglish) {
      return "Rohit Yadav ki science aur sports me bohot gehri ruchi hai:\n* **Astronomy**: Rooftop observer jo celestial objects (Jupiter, Orion, Andromeda Galaxy) track karte hain aur Zooniverse par astronomy tasks classifications me participate karte hain.\n* **Sports**: Passionate cricketer jo right-handed batter aur fast bowler hain.";
    } else {
      return "Rohit Yadav is deeply interested in science and sports:\n* **Astronomy**: Rooftop celestial tracker (Jupiter, Orion, Andromeda Galaxy) and participant in astronomical data classification on Zooniverse.\n* **Sports**: Passionate cricketer, playing as a right-handed batter and fast bowler.";
    }
  }
  if (hasSkills) {
    if (isHi) {
      return "\u0930\u094B\u0939\u093F\u0924 \u092F\u093E\u0926\u0935 \u0915\u0947 \u0924\u0915\u0928\u0940\u0915\u0940 \u0915\u094C\u0936\u0932\u094B\u0902 \u092E\u0947\u0902 **Python, HTML5/CSS3, JavaScript, React, Tailwind CSS, Flutter, React Native, Vercel, Firebase \u0914\u0930 Prompt Engineering** \u0936\u093E\u092E\u093F\u0932 \u0939\u0948\u0902\u0964";
    } else if (isHinglish) {
      return "Rohit Yadav ke technical skills me **Python, HTML5/CSS3, JavaScript, React, Tailwind CSS, Flutter, React Native, Vercel, Firebase aur Prompt Engineering** shamil hain.";
    } else {
      return "Rohit Yadav's technical skills include **Python, HTML5/CSS3, JavaScript, React, Tailwind CSS, Flutter, React Native, Vercel, Firebase, and Prompt Engineering**.";
    }
  }
  const matchCreatorProfile = norm === "rohit" || norm === "yadav" || norm === "rohit yadav" || norm.includes("creator profile") || norm.includes("about your creator") || norm.includes("creator ke bare") || norm.includes("creator ke baare") || norm.includes("creator details") || norm.includes("who is rohit") || norm.includes("rohit kaun hai") || norm.includes("rohit yadav kaun hai") || norm.includes("rohit ke baare") || norm.includes("rohit ke bare") || norm.includes("tell me about rohit") || norm.includes("tell me about your creator") || norm.includes("details of rohit") || norm.includes("details about rohit") || norm.includes("tell") && norm.includes("creator");
  if (matchCreatorSimple) {
    if (isHi) {
      return "\u092E\u0941\u091D\u0947 **Rohit Yadav** \u0928\u0947 \u092C\u0928\u093E\u092F\u093E \u0939\u0948\u0964 \u0915\u094D\u092F\u093E \u0906\u092A \u0909\u0928\u0915\u0947 \u092C\u093E\u0930\u0947 \u092E\u0947\u0902 \u0914\u0930 \u0915\u0941\u091B \u091C\u093E\u0928\u0928\u093E \u091A\u093E\u0939\u0947\u0902\u0917\u0947?";
    } else if (isHinglish) {
      return "Mujhe **Rohit Yadav** ne banaya hai. Kya aap unke baare me aur kuch jaan na chahenge?";
    } else {
      return "I was created by **Rohit Yadav**. Would you like to know more about him?";
    }
  }
  if (matchCreatorProfile) {
    if (isHi) {
      return `### \u{1F464} \u092E\u0947\u0930\u0947 \u0928\u093F\u0930\u094D\u092E\u093E\u0924\u093E \u0915\u093E \u092A\u094D\u0930\u094B\u092B\u093C\u093E\u0907\u0932: \u0930\u094B\u0939\u093F\u0924 \u092F\u093E\u0926\u0935 (Rohit Yadav)
**\u0938\u093E\u0907\u0902\u0938 \u0938\u094D\u091F\u0942\u0921\u0947\u0902\u091F (PCM) \u0914\u0930 \u092B\u0941\u0932-\u0938\u094D\u091F\u0948\u0915 / \u090F\u0906\u0908 \u0921\u0947\u0935\u0932\u092A\u0930**
*\u092E\u0939\u0947\u0936\u092A\u0941\u0930, \u091B\u092C\u0921\u093C\u093E \u0924\u0939\u0938\u0940\u0932, \u092C\u093E\u0930\u093E\u0902 \u091C\u093F\u0932\u093E, \u0930\u093E\u091C\u0938\u094D\u0925\u093E\u0928, \u092D\u093E\u0930\u0924*
*\u0915\u0915\u094D\u0937\u093E 12 \u0938\u093E\u0907\u0902\u0938 (PCM) | \u0905\u0930\u0941\u0923\u093E \u091C\u0947\u0908\u0908 3.0 (Arjuna JEE 3.0)*
*GitHub \u092A\u094B\u0930\u094D\u091F\u092B\u094B\u0932\u093F\u092F\u094B*: [heenayadav325200-png](https://github.com/heenayadav325200-png)

---

#### \u{1F4D6} \u092A\u094D\u0930\u094B\u092B\u093E\u0907\u0932 \u0938\u093E\u0930\u093E\u0902\u0936 (Profile Summary)
\u0930\u094B\u0939\u093F\u0924 \u092F\u093E\u0926\u0935 \u090F\u0915 \u0905\u0924\u094D\u092F\u0927\u093F\u0915 \u092E\u0939\u0924\u094D\u0935\u093E\u0915\u093E\u0902\u0915\u094D\u0937\u0940 \u0914\u0930 \u0909\u0924\u094D\u0938\u093E\u0939\u0940 \u0915\u0915\u094D\u0937\u093E 12 (PCM) \u0915\u0947 \u091B\u093E\u0924\u094D\u0930 \u0939\u0948\u0902, \u091C\u094B **\u0938\u094D\u0935\u093E\u092E\u0940 \u0935\u093F\u0935\u0947\u0915\u093E\u0928\u0902\u0926 \u0917\u0935\u0930\u094D\u0928\u092E\u0947\u0902\u091F \u092E\u0949\u0921\u0932 \u0938\u094D\u0915\u0942\u0932, \u0915\u0921\u093C\u0948\u092F\u093E\u092C\u0928, \u091B\u092C\u0921\u093C\u093E (\u0930\u093E\u091C\u0938\u094D\u0925\u093E\u0928)** \u092E\u0947\u0902 \u0905\u0927\u094D\u092F\u092F\u0928\u0930\u0924 \u0939\u0948\u0902\u0964 \u0935\u0947 \u090F\u0915 \u0938\u094D\u0935-\u0936\u093F\u0915\u094D\u0937\u093F\u0924 (self-taught) \u092B\u0941\u0932-\u0938\u094D\u091F\u0948\u0915 \u0938\u0949\u092B\u094D\u091F\u0935\u0947\u092F\u0930 \u0921\u0947\u0935\u0932\u092A\u0930, \u092E\u094B\u092C\u093E\u0907\u0932 \u0910\u092A \u0928\u093F\u0930\u094D\u092E\u093E\u0924\u093E, \u0914\u0930 \u090F\u0906\u0908/\u090F\u0932\u090F\u0932\u090F\u092E (AI/LLM) \u0909\u0924\u094D\u0938\u093E\u0939\u0940 \u0939\u0948\u0902\u0964 \u0935\u0947 \u092B\u093F\u091C\u093F\u0915\u094D\u0938, \u0915\u0947\u092E\u093F\u0938\u094D\u091F\u094D\u0930\u0940 \u0914\u0930 \u092E\u0948\u0925\u094D\u0938 \u092E\u0947\u0902 \u092E\u091C\u092C\u0942\u0924 \u0936\u0948\u0915\u094D\u0937\u0923\u093F\u0915 \u0927\u094D\u092F\u093E\u0928 \u092C\u0928\u093E\u090F \u0930\u0916\u0928\u0947 \u0915\u0947 \u0938\u093E\u0925-\u0938\u093E\u0925 \u0936\u093E\u0928\u0926\u093E\u0930 \u090F\u091C\u0941\u0915\u0947\u0936\u0928\u0932 \u0935\u0947\u092C \u0910\u092A\u094D\u0938, \u0915\u0938\u094D\u091F\u092E \u092E\u0949\u0921\u0932\u094D\u0938 (GGUF) \u0914\u0930 \u0935\u094D\u092F\u093E\u0935\u0939\u093E\u0930\u093F\u0915 \u092F\u0942\u091F\u093F\u0932\u093F\u091F\u0940 \u091F\u0942\u0932\u094D\u0938 \u0935\u093F\u0915\u0938\u093F\u0924 \u0915\u0930\u0924\u0947 \u0939\u0948\u0902\u0964

---

#### \u{1F393} \u0936\u093F\u0915\u094D\u0937\u093E (Education)
* **\u0938\u094D\u0915\u0942\u0932**: \u0938\u094D\u0935\u093E\u092E\u0940 \u0935\u093F\u0935\u0947\u0915\u093E\u0928\u0902\u0926 \u0917\u0935\u0930\u094D\u0928\u092E\u0947\u0902\u091F \u092E\u0949\u0921\u0932 \u0938\u094D\u0915\u0942\u0932, \u0915\u0921\u093C\u0948\u092F\u093E\u092C\u0928, \u091B\u092C\u0921\u093C\u093E, \u0930\u093E\u091C\u0938\u094D\u0925\u093E\u0928
* **\u0915\u0915\u094D\u0937\u093E**: \u0915\u0915\u094D\u0937\u093E 12 \u0938\u093E\u0907\u0902\u0938 \u0938\u094D\u091F\u094D\u0930\u0940\u092E (\u092D\u094C\u0924\u093F\u0915\u0940, \u0930\u0938\u093E\u092F\u0928 \u0935\u093F\u091C\u094D\u091E\u093E\u0928, \u0917\u0923\u093F\u0924)
* **\u092A\u094D\u0930\u0924\u093F\u092F\u094B\u0917\u0940 \u092A\u0930\u0940\u0915\u094D\u0937\u093E**: Arjuna JEE 3.0 \u0915\u0947 \u091B\u093E\u0924\u094D\u0930

---

#### \u{1F680} \u092A\u094D\u0930\u092E\u0941\u0916 \u092A\u094D\u0930\u094B\u091C\u0947\u0915\u094D\u091F\u094D\u0938 \u0914\u0930 \u0928\u0935\u093E\u091A\u093E\u0930 (Key Projects & Innovations)
* **Sathi AI (\u0915\u0938\u094D\u091F\u092E 8B \u092A\u0948\u0930\u093E\u092E\u0940\u091F\u0930 LLM)**: \u092A\u093E\u092F\u0925\u0928, \u0917\u0942\u0917\u0932 \u0915\u094B\u0932\u093E\u092C \u0914\u0930 \`llama-cpp-python\` \u0930\u0928\u091F\u093E\u0907\u092E \u0935\u093E\u0924\u093E\u0935\u0930\u0923 \u0915\u093E \u0909\u092A\u092F\u094B\u0917 \u0915\u0930\u0915\u0947 \u0915\u0938\u094D\u091F\u092E-\u092A\u094D\u0930\u0936\u093F\u0915\u094D\u0937\u093F\u0924 GGUF \u092D\u093E\u0937\u093E \u092E\u0949\u0921\u0932 (\`sathi_ai_q4_k_m.gguf\`) \u0915\u094B \u0915\u0949\u0928\u094D\u092B\u093C\u093F\u0917\u0930, \u091F\u0947\u0938\u094D\u091F \u0914\u0930 \u0921\u093F\u092A\u094D\u0932\u0949\u092F \u0915\u093F\u092F\u093E\u0964
* **Ascend Study / Ascend Study Buddy**: \u091B\u093E\u0924\u094D\u0930\u094B\u0902 \u0915\u0940 \u092E\u0926\u0926 \u0915\u0947 \u0932\u093F\u090F \u0928\u093F\u0930\u094D\u092E\u093F\u0924 \u090F\u0915 \u0938\u0941\u0935\u094D\u092F\u0935\u0938\u094D\u0925\u093F\u0924 \u0936\u0948\u0915\u094D\u0937\u0923\u093F\u0915 \u0935\u0947\u092C \u090F\u092A\u094D\u0932\u0940\u0915\u0947\u0936\u0928, \u091C\u093F\u0938\u092E\u0947\u0902 \u0938\u0902\u0930\u091A\u093F\u0924 \u0905\u0927\u094D\u092F\u092F\u0928 \u0938\u093E\u092E\u0917\u094D\u0930\u0940 \u0914\u0930 \u0907\u0902\u091F\u0930\u0948\u0915\u094D\u091F\u093F\u0935 \u0932\u0930\u094D\u0928\u093F\u0902\u0917 \u092E\u0949\u0921\u094D\u092F\u0942\u0932 \u0936\u093E\u092E\u093F\u0932 \u0939\u0948\u0902\u0964 (React, Firebase, Vercel)\u0964
* **CORE AI**: \u0924\u094D\u0935\u0930\u093F\u0924-\u0905\u092D\u093F\u092F\u093E\u0902\u0924\u094D\u0930\u093F\u0915\u0940 (prompt-engineered) \u091A\u0948\u091F \u0935\u0930\u094D\u0915\u092B\u093C\u094D\u0932\u094B \u0914\u0930 \u0938\u0939\u091C \u092F\u0942\u091C\u0930 \u0907\u0902\u091F\u0930\u0948\u0915\u094D\u0936\u0928 \u092E\u0949\u0921\u0932 \u0938\u0947 \u0932\u0948\u0938 \u090F\u0915 \u0915\u0938\u094D\u091F\u092E\u093E\u0907\u091C\u093C\u094D\u0921 \u0915\u0928\u094D\u0935\u0930\u094D\u0938\u0947\u0936\u0928\u0932 \u090F\u0906\u0908 \u0905\u0938\u093F\u0938\u094D\u091F\u0947\u0902\u091F \u0935\u0947\u092C \u0907\u0902\u091F\u0930\u092B\u093C\u0947\u0938\u0964
* **PocketPaisa / PocketPaisa Pro**: \u0935\u093F\u0924\u094D\u0924\u0940\u092F \u092A\u094D\u0930\u092C\u0902\u0927\u0928 \u0914\u0930 \u0926\u0948\u0928\u093F\u0915 \u0916\u0930\u094D\u091A\u094B\u0902 \u0915\u094B \u091F\u094D\u0930\u0948\u0915 \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u0928\u093F\u0930\u094D\u092E\u093F\u0924 \u090F\u0915 \u0935\u094D\u092F\u093E\u092A\u0915 \u0935\u0947\u092C \u090F\u092A\u094D\u0932\u0940\u0915\u0947\u0936\u0928\u0964
* **DriveMate AI (\u0921\u094D\u0930\u093E\u0908\u0935 \u092E\u0947\u091F \u090F\u0906\u0908)**: \u0938\u0921\u093C\u0915 \u0938\u0941\u0930\u0915\u094D\u0937\u093E \u092E\u0947\u0902 \u0938\u0941\u0927\u093E\u0930 \u0915\u0947 \u0909\u0926\u094D\u0926\u0947\u0936\u094D\u092F \u0938\u0947 \u0921\u093F\u091C\u093E\u0907\u0928 \u0915\u093F\u092F\u093E \u0917\u092F\u093E \u090F\u0915 \u0907\u0902\u091F\u0947\u0932\u093F\u091C\u0947\u0902\u091F \u0921\u094D\u0930\u093E\u0907\u0935\u093F\u0902\u0917 \u0905\u0938\u093F\u0938\u094D\u091F\u0947\u0902\u091F \u092C\u094D\u0932\u0942\u092A\u094D\u0930\u093F\u0902\u091F\u0964
* **THERMONEST V1**: \u090F\u0915 \u0915\u0921\u093C\u093E, \u0917\u0948\u0930-\u0935\u093F\u0926\u094D\u092F\u0941\u0924 \u0935\u093E\u0937\u094D\u092A\u0940\u0915\u0930\u0923\u0940\u092F (non-electric evaporative) \u0914\u0930 \u0917\u094D\u0930\u093E\u0909\u0902\u0921 \u092A\u094D\u0930\u0940-\u0915\u0942\u0932\u093F\u0902\u0917 \u0938\u093F\u0938\u094D\u091F\u092E \u0915\u0947 \u0932\u093F\u090F \u0924\u0948\u092F\u093E\u0930 \u0915\u093F\u092F\u093E \u0917\u092F\u093E \u0924\u0915\u0928\u0940\u0915\u0940 \u092C\u094D\u0932\u0942\u092A\u094D\u0930\u093F\u0902\u091F\u0964

---

#### \u{1F6E0}\uFE0F \u0924\u0915\u0928\u0940\u0915\u0940 \u0915\u094C\u0936\u0932 (Technical Skills)
* **\u092D\u093E\u0937\u093E\u090F\u0902**: Python, HTML5, CSS3, JavaScript
* **\u092B\u094D\u0930\u0947\u092E\u0935\u0930\u094D\u0915 \u0914\u0930 \u091F\u0942\u0932\u094D\u0938**: React, Tailwind CSS, Flutter, React Native, Git & GitHub, Vercel, Firebase, Prompt Engineering, Google Colab & GGUF Models

---

#### \u{1F30C} \u092A\u093E\u0920\u094D\u092F\u0947\u0924\u0930 \u0917\u0924\u093F\u0935\u093F\u0927\u093F\u092F\u093E\u0902 \u0914\u0930 \u0935\u093F\u091C\u094D\u091E\u093E\u0928 (Extracurricular Interests)
* **\u0916\u0917\u094B\u0932 \u0935\u093F\u091C\u094D\u091E\u093E\u0928 \u0914\u0930 \u0928\u093E\u0917\u0930\u093F\u0915 \u0935\u093F\u091C\u094D\u091E\u093E\u0928**: \u091B\u0924 \u0938\u0947 \u0906\u0915\u093E\u0936\u0940\u092F \u092A\u093F\u0902\u0921\u094B\u0902 (\u091C\u0948\u0938\u0947 \u092C\u0943\u0939\u0938\u094D\u092A\u0924\u093F, \u0913\u0930\u093F\u092F\u0928 \u0928\u0915\u094D\u0937\u0924\u094D\u0930, \u090F\u0902\u0921\u094D\u0930\u094B\u092E\u0947\u0921\u093E \u0917\u0948\u0932\u0947\u0915\u094D\u0938\u0940) \u0915\u093E \u0905\u0935\u0932\u094B\u0915\u0928 \u0915\u0930\u0928\u093E \u0914\u0930 \u091C\u0942\u0928\u093F\u0935\u0930\u094D\u0938 (Zooniverse) \u092A\u0930 \u0916\u0917\u094B\u0932\u0940\u092F \u0921\u0947\u091F\u093E \u0935\u0930\u094D\u0917\u0940\u0915\u0930\u0923 \u0915\u093E\u0930\u094D\u092F\u094B\u0902 \u092E\u0947\u0902 \u092D\u093E\u0917 \u0932\u0947\u0928\u093E\u0964
* **\u0916\u0947\u0932**: \u090F\u0915 \u0909\u0924\u094D\u0938\u093E\u0939\u0940 \u0915\u094D\u0930\u093F\u0915\u0947\u091F\u0930, \u091C\u094B \u0926\u093E\u090F\u0902 \u0939\u093E\u0925 \u0915\u0947 \u092C\u0932\u094D\u0932\u0947\u092C\u093E\u091C \u0914\u0930 \u0924\u0947\u091C \u0917\u0947\u0902\u0926\u092C\u093E\u091C \u0915\u0947 \u0930\u0942\u092A \u092E\u0947\u0902 \u0916\u0947\u0932\u0924\u0947 \u0939\u0948\u0902 \u0914\u0930 \u092A\u094D\u0930\u0924\u093F\u0938\u094D\u092A\u0930\u094D\u0927\u0940 \u0909\u0924\u094D\u0915\u0943\u0937\u094D\u091F\u0924\u093E \u0915\u0940 \u0913\u0930 \u0905\u0917\u094D\u0930\u0938\u0930 \u0939\u0948\u0902\u0964

---

*\u092F\u0926\u093F \u0906\u092A \u0930\u094B\u0939\u093F\u0924 \u092F\u093E\u0926\u0935 \u0915\u0947 \u092C\u093E\u0930\u0947 \u092E\u0947\u0902 \u0915\u094B\u0908 \u0910\u0938\u0940 \u091C\u093E\u0928\u0915\u093E\u0930\u0940 \u091C\u093E\u0928\u0928\u093E \u091A\u093E\u0939\u0924\u0947 \u0939\u0948\u0902 \u091C\u094B \u092F\u0939\u093E\u0901 \u0909\u092A\u0932\u092C\u094D\u0927 \u0928\u0939\u0940\u0902 \u0939\u0948, \u0924\u094B \u092E\u0948\u0902 \u0935\u093F\u0928\u092E\u094D\u0930\u0924\u093E\u092A\u0942\u0930\u094D\u0935\u0915 \u0938\u0942\u091A\u093F\u0924 \u0915\u0930\u0928\u093E \u091A\u093E\u0939\u0942\u0901\u0917\u093E \u0915\u093F **\u092E\u0947\u0930\u0947 Creator Profile \u092E\u0947\u0902 \u0907\u0938 \u091C\u093E\u0928\u0915\u093E\u0930\u0940 \u0915\u093E \u0909\u0932\u094D\u0932\u0947\u0916 \u0928\u0939\u0940\u0902 \u0939\u0948\u0964***`;
    } else if (isHinglish) {
      return `### \u{1F464} Creator Profile: Rohit Yadav
**Science Student (PCM) & Full-Stack / AI Developer**
*Maheshpur, Chhabra Tehsil, Baran District, Rajasthan, India*
*Class 12 Science (PCM) | Arjuna JEE 3.0 Student*
*GitHub Portfolio*: [heenayadav325200-png](https://github.com/heenayadav325200-png)

---

#### \u{1F4D6} Profile Summary
Rohit Yadav ek ambitious aur passionate Class 12 Science (PCM) student hain jo **Swami Vivekanand Government Model School, Kadaiyaban, Chhabra (Rajasthan)** me padhte hain. Unhe self-taught full-stack software development, mobile app creation, AI integration aur custom GGUF/LLM models handling ka bohot acha experience hai. Wo apni Physics, Chemistry aur Mathematics ki padhai ke sath-sath educational web apps aur machine learning interfaces develop karte hain.

---

#### \u{1F393} Education
* **School**: Swami Vivekanand Government Model School, Kadaiyaban, Chhabra, Rajasthan
* **Class**: Class 12 Science Stream (Physics, Chemistry, Mathematics)
* **Exam Prep**: Enrolled in Arjuna JEE 3.0

---

#### \u{1F680} Key Projects & Innovations
* **Sathi AI (Custom 8B Parameter LLM)**: Python, Google Colab, aur \`llama-cpp-python\` runtime ka use karke custom-trained GGUF models (\`sathi_ai_q4_k_m.gguf\`) configure aur deploy kiya.
* **Ascend Study / Ascend Study Buddy**: Ek feature-rich educational web application jo students ko study resources aur interactive learning provide karta hai (React, Firebase, Vercel).
* **CORE AI**: Custom conversational AI assistant web interface jisme prompt-engineered chat workflows hain.
* **PocketPaisa / PocketPaisa Pro**: Expense tracking aur personal finance management application.
* **DriveMate AI (\u0921\u094D\u0930\u093E\u0908\u0935 \u092E\u0947\u091F \u090F\u0906\u0908)**: Road safety improve karne ke liye intelligent driving assistant concept.
* **THERMONEST V1**: Non-electric, sustainable evaporative and ground pre-cooling system ka technical blueprint.

---

#### \u{1F6E0}\uFE0F Technical Skills & Expertise
* **Languages**: Python, HTML5, CSS3, JavaScript
* **Frameworks & Tools**: React, Tailwind CSS, Flutter, React Native, Git & GitHub, Vercel, Firebase, Prompt Engineering, Google Colab & GGUF Models

---

#### \u{1F30C} Extracurricular Interests & Science
* **Astronomy & Citizen Science**: Rooftop observer jo celestial objects (Jupiter, Orion, Andromeda Galaxy) track karte hain aur Zooniverse par astronomical data classification me participate karte hain.
* **Sports**: Passionate cricketer jo right-handed batter aur fast bowler hain.

---

*Agar aap Rohit ke baare me koi aisi baat puch rahe hain jo is profile me nahi hai, toh **mere Creator Profile me is jankari ka ullekh nahi hai.***`;
    } else {
      return `### \u{1F464} Creator Profile: Rohit Yadav
**Science Student (PCM) & Full-Stack / AI Developer**
*Maheshpur, Chhabra Tehsil, Baran District, Rajasthan, India*
*Class 12 Science (PCM) | Arjuna JEE 3.0 Student*
*GitHub Portfolio*: [heenayadav325200-png](https://github.com/heenayadav325200-png)

---

#### \u{1F4D6} Profile Summary
Rohit Yadav is an ambitious and passionate Class 12 Science (PCM) student at **Swami Vivekanand Government Model School, Kadaiyaban, Chhabra, Rajasthan**. He has extensive self-taught expertise in full-stack software development, mobile application creation, AI integration, and custom GGUF/LLMs handling. He successfully balances a rigorous academic focus in Physics, Chemistry, and Mathematics while engineering highly useful educational web apps and machine learning interfaces.

---

#### \u{1F393} Education
* **School**: Swami Vivekanand Government Model School, Kadaiyaban, Chhabra, Rajasthan
* **Class**: Class 12 Science Stream (Physics, Chemistry, Mathematics)
* **Exam Prep**: Enrolled in Arjuna JEE 3.0

---

#### \u{1F680} Key Projects & Innovations
* **Sathi AI (Custom 8B Parameter LLM)**: Configured, tested, and deployed custom-trained GGUF language models (\`sathi_ai_q4_k_m.gguf\`) using Python, Google Colab, and \`llama-cpp-python\` runtime environments.
* **Ascend Study / Ascend Study Buddy**: Designed and deployed a feature-rich educational web application to aid students with structured study resources and interactive learning modules. (React, Firebase, Vercel).
* **CORE AI**: Developed a custom AI assistant web interface featuring prompt-engineered chat workflows and seamless user interaction models.
* **PocketPaisa / PocketPaisa Pro**: Conceptualized and published a comprehensive financial management and expense tracking web application.
* **DriveMate AI (\u0921\u094D\u0930\u093E\u0908\u0935 \u092E\u0947\u091F \u090F\u0906\u0908)**: Engineered an intelligent driving assistant blueprint aimed at improving road safety.
* **THERMONEST V1**: Drafted technical blueprints and specifications for a sustainable, non-electric evaporative and ground pre-cooling system.

---

#### \u{1F6E0}\uFE0F Technical Skills & Expertise
* **Languages**: Python, HTML5, CSS3, JavaScript
* **Frameworks & Tools**: React, Tailwind CSS, Flutter, React Native, Git & GitHub, Vercel, Firebase, Prompt Engineering, Google Colab & GGUF Models

---

#### \u{1F30C} Extracurricular Interests & Science
* **Astronomy & Citizen Science**: Rooftop observer tracking celestial objects (Jupiter, Orion, Andromeda Galaxy) and participating in astronomical data classification tasks on Zooniverse.
* **Sports**: Passionate cricketer, playing as a right-handed batter and fast bowler with aspirations of competitive excellence.

---

*If you are asking about any information not listed here, **there is no mention of this detail in my official Creator Profile.***`;
    }
  }
  if (norm.includes("rohit") || norm.includes("yadav")) {
    if (isHi) {
      return "\u092E\u0947\u0930\u0947 \u092A\u093E\u0938 \u092E\u0947\u0930\u0947 Creator **Rohit Yadav** \u0915\u0947 \u092C\u093E\u0930\u0947 \u092E\u0947\u0902 \u0915\u0947\u0935\u0932 \u0909\u0928\u0915\u0947 \u0906\u0927\u093F\u0915\u093E\u0930\u093F\u0915 \u092A\u094D\u0930\u094B\u092B\u093E\u0907\u0932 \u0915\u0940 \u091C\u093E\u0928\u0915\u093E\u0930\u0940 \u0939\u0948\u0964 **\u092E\u0947\u0930\u0947 Creator Profile \u092E\u0947\u0902 \u0907\u0938 \u091C\u093E\u0928\u0915\u093E\u0930\u0940 \u0915\u093E \u0909\u0932\u094D\u0932\u0947\u0916 \u0928\u0939\u0940\u0902 \u0939\u0948\u0964**";
    } else {
      return "I only have information from the official profile of my creator, **Rohit Yadav**. **There is no mention of this detail in my Creator Profile.**";
    }
  }
  return null;
}

// server.ts
import_dotenv.default.config();
var PORT = 3e3;
var SmartCache = class {
  cache = /* @__PURE__ */ new Map();
  maxItems;
  defaultTTL;
  constructor(maxItems = 3e3, defaultTTLMinutes = 60) {
    this.maxItems = maxItems;
    this.defaultTTL = defaultTTLMinutes * 60 * 1e3;
    setInterval(() => this.purgeExpired(), 3 * 60 * 1e3);
  }
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.data;
  }
  set(key, data, ttlMs) {
    if (this.cache.size >= this.maxItems) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, {
      data,
      expiry: Date.now() + (ttlMs || this.defaultTTL)
    });
  }
  purgeExpired() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }
};
var apiCache = new SmartCache(3e3, 60);
process.on("unhandledRejection", (reason) => {
  console.warn("Process resilience: unhandled rejection caught:", reason);
});
process.on("uncaughtException", (error) => {
  console.error("Process resilience: uncaught exception caught:", error);
});
var aiClient = null;
var currentKey = null;
var isKeyReportedLeaked = false;
function getAiClient() {
  const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY || "";
  if (!key || key.trim() === "") {
    return null;
  }
  if (currentKey !== key) {
    currentKey = key;
    isKeyReportedLeaked = false;
    aiClient = new import_genai.GoogleGenAI({
      apiKey: key.trim(),
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  if (isKeyReportedLeaked) {
    return null;
  }
  return aiClient;
}
var FALLBACK_MODELS = [
  "gemini-3.5-flash",
  "gemini-2.5-flash",
  "gemini-3.1-flash-lite"
];
async function callGeminiWithResilience(params) {
  const ai = getAiClient();
  if (!ai) {
    throw new Error(isKeyReportedLeaked ? "GEMINI_KEY_LEAKED_OR_FORBIDDEN" : "GEMINI_API_KEY_UNAVAILABLE");
  }
  const preferred = params.preferredModel || "gemini-3.5-flash";
  const modelsToTry = Array.from(/* @__PURE__ */ new Set(["gemini-3.5-flash", preferred, ...FALLBACK_MODELS]));
  let lastError = null;
  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (err) {
      lastError = err;
      const errMsg = err?.message || String(err);
      const isActualLeak = errMsg.includes("API key was reported as leaked") || errMsg.includes("leaked") && errMsg.includes("key");
      if (isActualLeak) {
        isKeyReportedLeaked = true;
        throw new Error("GEMINI_KEY_LEAKED_OR_FORBIDDEN");
      }
      const isQuotaOrRateLimit = errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota") || errMsg.includes("Too Many Requests") || errMsg.includes("rate-limits");
      if (isQuotaOrRateLimit) {
        console.log(`[Gemini Resilience] Model ${model} rate-limited. Trying alternative model...`);
        continue;
      }
      console.warn(`[Gemini Resilience] Model ${model} attempt failed: ${errMsg.slice(0, 80)}. Trying fallback...`);
      continue;
    }
  }
  throw lastError || new Error("AI service temporarily unavailable. Please retry in a moment.");
}
var app = (0, import_express.default)();
app.disable("x-powered-by");
app.use(securityHeaders);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    "https://studyhalper.vercel.app",
    "http://localhost",
    "http://localhost:3000",
    "capacitor://localhost"
  ];
  if (origin) {
    if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app") || origin.includes("run.app")) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      res.setHeader("Access-Control-Allow-Origin", "https://studyhalper.vercel.app");
    }
  } else {
    res.setHeader("Access-Control-Allow-Origin", "https://studyhalper.vercel.app");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-gemini-quota-exceeded");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});
if (process.env.VERCEL === "1") {
  app.use((req, _res, next) => {
    const matchedPath = req.headers["x-matched-path"] || req.headers["x-vercel-matched-path"];
    if (matchedPath && matchedPath.startsWith("/api/")) {
      req.url = matchedPath;
    } else if (!req.url.startsWith("/api/") && req.url !== "/api") {
      req.url = "/api" + (req.url.startsWith("/") ? req.url : "/" + req.url);
    }
    next();
  });
}
app.use((0, import_compression.default)({
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) return false;
    return import_compression.default.filter(req, res);
  },
  level: 6
}));
app.use(import_express.default.json({ limit: "10mb" }));
app.use("/api", sanitizeInputs);
app.use("/api", rateLimitGeneral);
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: Math.round(process.uptime())
  });
});
app.post("/api/gemini/answer", rateLimitAi, async (req, res) => {
  try {
    const { prompt, imageBase64, imagesBase64, studentContext, language, persona, history } = req.body;
    if (!prompt && !imageBase64 && (!imagesBase64 || imagesBase64.length === 0)) {
      res.status(400).json({ error: "Prompt or image is required." });
      return;
    }
    const creatorResponse = checkCreatorQuestion(prompt, language);
    if (creatorResponse) {
      res.json({ text: creatorResponse });
      return;
    }
    const hasImages = imageBase64 || imagesBase64 && imagesBase64.length > 0;
    const hasHistory = Array.isArray(history) && history.length > 0;
    let cacheKey = "";
    if (!hasImages && !hasHistory && prompt) {
      cacheKey = `ans_${language || "en"}_${persona || "gen"}_${prompt.trim().toLowerCase().slice(0, 200)}`;
      const cached = apiCache.get(cacheKey);
      if (cached) {
        res.json({ text: cached });
        return;
      }
    }
    const studentInfo = studentContext && studentContext.name ? `Addressing student: ${studentContext.name} (${studentContext.className || ""} ${studentContext.school || ""}).` : "";
    const personaStyle = persona === "socratic" ? "Mode: SOCRATIC TEACHER - Guide with helpful probing questions before revealing full answers." : persona === "math" ? "Mode: MATH WIZARD - Show ultra-precise mathematical steps and boxed answers." : "Mode: GENERAL TUTOR - Provide clear, intuitive, and structured explanations.";
    const sysInstruction = `You are ASCEND AI TUTOR \u2014 an intelligent, calm, highly capable study partner who helps students genuinely understand subjects and become better at solving problems independently. You are a brilliant senior/student mentor who deeply understands the subject and explains difficult ideas simply, naturally, and confidently.
${studentInfo} ${personaStyle}

YOUR CORE IDENTITY & VOICE:
- Tone & Personality: Intelligent, calm, clear, curious, patient, honest, encouraging, precise, and student-aware.
- Mentor Voice: Speak like a brilliant senior/student mentor who deeply understands the subject and knows how to explain difficult ideas simply. Be natural, confident, and slightly conversational. Never sound like a corporate chatbot, a digital textbook, a motivational speaker, a customer-support agent, or an overly excited AI.
- Core Principle: "Understand first. Solve second. Memorize only what actually needs memorizing."
- NO COMPLIMENT FILLER / NO CONVERSATIONAL FLUFF: Never start responses with things like "Excellent choice!", "That's a fantastic question!", "Let's tackle this!", "Let's dive right in!", "Absolutely!", "Certainly!". Do NOT use unnecessary greetings or introductions. Open directly with the core concept or answer.
- Praise Policy: Keep praise minimal and realistic. Never use excessive exclamation marks or hype words. Use balanced, constructive validation like "You are close, but..." or "That is a solid start; let's refine...".
- Emojis Policy: Use very few emojis. Never use emojis as decorative markers for headings or lists. The response must look professional even if all emojis are removed.

YOUR SPECIFIC INTERACTION BEHAVIORS:

1. WHEN THE STUDENT IS CONFUSED:
Do not simply repeat the same explanation. Identify the confusing component and explain it from a completely different angle.
Example cue: "You're probably getting stuck on this part: ..." then simplify it with a new intuitive approach.

2. WHEN THE STUDENT MAKES A MISTAKE:
Never shame, mock, or offer patronizing pity. Clearly identify the error, explain WHY it is incorrect, and then demonstrate the correct logical reasoning path.

3. WHEN THE STUDENT IS STUCK:
Do not immediately dump the complete solution. Provide a scaffolded response: first give a clean Hint -> then small guidance -> then a deeper hint -> and only provide the full solution if they remain unable to proceed.

4. WHEN SOLVING NUMERICALS:
Think in the sequence: Understand -> Plan -> Solve -> Verify. Show only useful reasoning and calculations. Do not create unnecessary or artificial steps. Connect WHY -> HOW -> APPLY -> VERIFY naturally.

5. WHEN TEACHING A CONCEPT:
Start with direct intuition or an everyday analogy. Then introduce the formal definition. Finally, connect it to formulas, mathematical examples, or real-world applications.

6. ADAPTING TO RESPONSE DEPTH:
- Simple question: Answer simply and concisely. Do not turn a one-line question into a massive lecture.
- Conceptual confusion: Focus heavily on an intuitive explanation.
- Homework / Stuck: Provide guided hints to build independent solving skills.
- Numerical: Show a clean, step-by-step mathematical path (variables, formulas, substitution, verification).
- Revision: Deliver a compact, recall-focused summary.
- Advanced or Exam/JEE-level questions: Increase technical depth naturally. Do not oversimplify.

7. ENCOURAGEMENT & HONESTY:
Encourage through constructive, precise feedback rather than empty praise. Avoid generic fluff. If information is uncertain, admit it honestly. If a student's assumption is wrong, correct it respectfully.

8. MULTILINGUAL & HINGLISH EXCELLENCE:
- Language requested: ${language === "hi" ? "Hindi (Devanagari script)" : language === "Hinglish" ? "Hinglish (mix of simple Hindi & English in Latin script)" : "English"}.
- Always reply fluently and naturally in the requested language, prioritizing ultimate conceptual clarity.`;
    const contents = [];
    if (history && Array.isArray(history) && history.length > 0) {
      for (const msg of history) {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text || "" }]
        });
      }
    }
    const currentParts = [{ text: prompt || "Please analyze and explain the uploaded homework image(s) step-by-step." }];
    const allImages = [];
    if (Array.isArray(imagesBase64) && imagesBase64.length > 0) {
      allImages.push(...imagesBase64);
    } else if (imageBase64) {
      allImages.push(imageBase64);
    }
    for (const img of allImages) {
      if (!img || typeof img !== "string") continue;
      const mimeMatch = img.match(/^data:(image\/\w+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
      const cleanBase64 = img.replace(/^data:image\/\w+;base64,/, "");
      currentParts.push({
        inlineData: {
          mimeType,
          data: cleanBase64
        }
      });
    }
    contents.push({
      role: "user",
      parts: currentParts
    });
    const answerText = await callGeminiWithResilience({
      contents,
      config: {
        systemInstruction: sysInstruction,
        temperature: 0.3
      }
    });
    if (cacheKey && answerText) {
      apiCache.set(cacheKey, answerText, 60 * 60 * 1e3);
    }
    res.json({ text: answerText });
  } catch (err) {
    const isKeyIssue = err?.message === "GEMINI_KEY_LEAKED_OR_FORBIDDEN" || err?.message === "GEMINI_API_KEY_UNAVAILABLE" || err?.message && (err.message.includes("leaked") || err.message.includes("403") || err.message.includes("PERMISSION_DENIED"));
    if (isKeyIssue) {
      console.log("[AI Tutor] Gemini API key status notice: using resilient curriculum knowledge engine.");
    } else {
      console.log("[AI Tutor] Serving academic answer via resilient curriculum knowledge engine.");
    }
    const fallbackPrompt = req.body?.prompt || "Study Question";
    const fallbackAnswer = generateCurriculumStudyAnswer({
      prompt: fallbackPrompt,
      language: req.body?.language,
      persona: req.body?.persona,
      studentContext: req.body?.studentContext,
      isApiKeyIssue: isKeyIssue
    });
    res.json({ text: fallbackAnswer });
  }
});
app.post("/api/gemini/quiz", rateLimitAi, async (req, res) => {
  try {
    const { subject, topic, studentContext, language, difficulty, questionCount } = req.body || {};
    const numQuestions = Math.max(3, Math.min(Number(questionCount) || 10, 30));
    const chosenTopic = (topic || studentContext?.topic || studentContext?.className?.split("Topic:")?.[1] || subject || "Core Concepts").trim();
    let langName = "English";
    let langCode = "en";
    const normLang = String(language || "").toLowerCase().trim();
    if (normLang === "hi" || normLang === "hindi") {
      langName = "pure, standard Hindi (\u0939\u093F\u0902\u0926\u0940 in Devanagari script)";
      langCode = "hi";
    } else if (normLang === "hinglish") {
      langName = 'friendly Hinglish (a casual conversational blend of Hindi and English written in the English/Latin alphabet, e.g. "Is reaction ka main catalyst kaun sa hai?")';
      langCode = "hinglish";
    } else if (normLang === "marathi") {
      langName = "Marathi (\u092E\u0930\u093E\u0920\u0940)";
      langCode = "marathi";
    } else if (normLang === "tamil") {
      langName = "Tamil (\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD)";
      langCode = "tamil";
    } else if (normLang === "bengali") {
      langName = "Bengali (\u09AC\u09BE\u0982\u09B2\u09BE)";
      langCode = "bengali";
    }
    const cleanSubject = subject || "General";
    const prompt = `You are the ASCEND QUIZ MASTER & ACADEMIC EXAM ENGINE.
Generate a high-quality, authentic academic mock exam with EXACTLY ${numQuestions} multiple choice questions (MCQs) for the subject "${cleanSubject}" on the topic: "${chosenTopic}".

CRITICAL REQUIREMENTS:
1. Topic Fidelity: Every single question MUST strictly test genuine concepts, formulas, applications, or principles of "${chosenTopic}" within "${cleanSubject}".
2. Language: The entire exam (questions, 4 options, explanations) MUST be strictly in ${langName}. If English is requested, do NOT use Hindi. If Hindi is requested, write in clean Devanagari. If Hinglish is requested, write in Latin alphabet mix.
3. Difficulty: ${difficulty || "Medium"}.
4. RANDOMIZED ANSWER PLACEMENT (NO FIXED 'C' PATTERN):
   - You MUST distribute correct answers completely randomly across all 4 positions (A, B, C, D / indices 0, 1, 2, 3).
   - NEVER place the answer on 'C' for all or most questions. Ensure an approximately equal and unpredictable distribution of 0, 1, 2, and 3.

OUTPUT FORMAT: Return STRICTLY a valid JSON array of objects. Do NOT wrap in \`\`\`json markdown blocks. Return only raw JSON.
Each object in the array must strictly have these keys:
- "question": string (the question text)
- "options": array of exactly 4 strings (A, B, C, D)
- "answer": integer index (0 for A, 1 for B, 2 for C, 3 for D)
- "explanation": string (clear conceptual reason why this option is correct)`;
    let questions = [];
    try {
      const text2 = await callGeminiWithResilience({
        contents: prompt,
        preferredModel: "gemini-2.5-flash",
        config: {
          temperature: 0.8
        }
      });
      const cleanJsonStr = text2.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJsonStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        questions = parsed;
      }
    } catch (aiErr) {
      console.warn("[AI Quiz Route] Gemini API fallback triggered:", aiErr);
    }
    if (!questions || questions.length === 0) {
      questions = generateSubjectMockQuestions(cleanSubject, chosenTopic, langCode, numQuestions);
    }
    const normalized = questions.slice(0, numQuestions).map((q) => {
      const qText = q.question || q.questionText || "Question";
      const rawOptions = Array.isArray(q.options) && q.options.length === 4 ? [...q.options] : ["Option A", "Option B", "Option C", "Option D"];
      let origAnsIdx = typeof q.answer === "number" ? q.answer : typeof q.correctOptionIndex === "number" ? q.correctOptionIndex : 0;
      origAnsIdx = Math.max(0, Math.min(rawOptions.length - 1, origAnsIdx));
      const correctAnswerText = rawOptions[origAnsIdx];
      for (let i = rawOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rawOptions[i], rawOptions[j]] = [rawOptions[j], rawOptions[i]];
      }
      const newAnsIdx = rawOptions.indexOf(correctAnswerText);
      return {
        question: qText,
        options: rawOptions,
        answer: newAnsIdx >= 0 ? newAnsIdx : Math.floor(Math.random() * 4),
        explanation: q.explanation || "Correct concept application and logical derivation."
      };
    });
    res.json(normalized);
  } catch (err) {
    console.error("[Quiz API Error]:", err);
    const fallbackQuestions = generateSubjectMockQuestions(
      req.body?.subject || "Mathematics",
      req.body?.topic || "Core Concepts",
      req.body?.language === "hi" ? "hi" : "en",
      req.body?.questionCount || 10
    );
    res.json(fallbackQuestions.map((q) => ({
      question: q.questionText,
      options: q.options,
      answer: q.correctOptionIndex,
      explanation: q.explanation
    })));
  }
});
app.post("/api/generate-exam", rateLimitAi, async (req, res) => {
  try {
    const { subject, topic, language, questionCount } = req.body;
    if (!subject || !topic) {
      res.status(400).json({ error: "Subject and topic are required." });
      return;
    }
    const numQuestions = Math.max(3, Math.min(Number(questionCount) || 10, 30));
    const prompt = `Generate a highly educational mock exam with exactly ${numQuestions} multiple choice questions on the subject "${subject}" and topic "${topic}".
The entire exam must be written in the language: ${language === "hi" ? "Hindi (\u0939\u093F\u0902\u0926\u0940)" : "English"}.
CRITICAL: Distribute the correct answer index (0, 1, 2, 3) completely RANDOMLY across questions. Never make all answers option C or repeat the same option consecutively for all questions.
You must format your response as a valid JSON array of objects. Do not include any markdown format blocks or code wrappers like \`\`\`json. Return only the raw JSON.
Each object in the array must strictly have these keys:
"questionText" (string)
"options" (array of 4 strings)
"correctOptionIndex" (number from 0 to 3)
"explanation" (string explaining the correct choice)`;
    let questions = [];
    try {
      const text2 = await callGeminiWithResilience({ contents: prompt });
      const cleanJsonStr = text2.replace(/```json/g, "").replace(/```/g, "").trim();
      questions = JSON.parse(cleanJsonStr);
    } catch {
      console.log("[AI Mock Exam] Serving structured curriculum mock exam questions for", topic);
      questions = generateSubjectMockQuestions(subject, topic, language === "hi" ? "hi" : "en", numQuestions);
    }
    const randomized = (Array.isArray(questions) && questions.length > 0 ? questions : generateSubjectMockQuestions(subject, topic, language === "hi" ? "hi" : "en", numQuestions)).slice(0, numQuestions).map((q) => {
      const rawOptions = Array.isArray(q.options) && q.options.length === 4 ? [...q.options] : ["A", "B", "C", "D"];
      const origIdx = typeof q.correctOptionIndex === "number" ? q.correctOptionIndex : typeof q.answer === "number" ? q.answer : 0;
      const safeIdx = Math.max(0, Math.min(rawOptions.length - 1, origIdx));
      const correctText = rawOptions[safeIdx];
      for (let i = rawOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rawOptions[i], rawOptions[j]] = [rawOptions[j], rawOptions[i]];
      }
      const newIdx = rawOptions.indexOf(correctText);
      return {
        questionText: q.questionText || q.question || "Mock Question",
        options: rawOptions,
        correctOptionIndex: newIdx >= 0 ? newIdx : Math.floor(Math.random() * 4),
        explanation: q.explanation || "Correct concept application."
      };
    });
    res.json({ questions: randomized });
  } catch {
    console.log("[AI Mock Exam] Using curriculum mock exam fallback for", req.body?.subject, req.body?.topic);
    const fallbackQuestions = generateSubjectMockQuestions(req.body?.subject, req.body?.topic, req.body?.language === "hi" ? "hi" : "en", req.body?.questionCount || 10);
    res.json({ questions: fallbackQuestions });
  }
});
app.post("/api/gemini/suggestions", rateLimitAi, async (req, res) => {
  try {
    const { history, subject, studentContext, language } = req.body;
    const cacheKey = `sugg_${subject || "gen"}_${language || "en"}`;
    const cached = apiCache.get(cacheKey);
    if (cached) {
      res.json({ suggestions: cached });
      return;
    }
    const lastMsgsText = Array.isArray(history) ? history.slice(-4).map((m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.text}`).join("\n\n") : "Student starting learning session.";
    const prompt = `You are the ASCEND AI TUTOR SUGGESTION ENGINE.
Analyze the current academic chat context between a student and their AI tutor:

SUBJECT: ${subject || "General"}
LANGUAGE: ${language === "hi" ? "Hindi (\u0939\u093F\u0902\u0926\u0940)" : "English"}
STUDENT: ${studentContext?.name || "Student"} (${studentContext?.className || "Grade 10"}, Target: ${studentContext?.targetGoal || "General"})
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
    let suggestions = [];
    try {
      const text2 = await callGeminiWithResilience({ contents: prompt });
      const cleanJsonStr = text2.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJsonStr);
      if (parsed && Array.isArray(parsed.suggestions)) {
        suggestions = parsed.suggestions.slice(0, 3);
      } else if (Array.isArray(parsed)) {
        suggestions = parsed.slice(0, 3);
      }
    } catch (suggErr) {
      suggestions = [
        {
          label: "\u{1F52C} Deep Dive & Derivation",
          prompt: `Can you explain the detailed proof and step-by-step derivation for ${subject || "this topic"}?`,
          subtitle: "Step-by-step mathematical proof",
          category: "deep_dive",
          badge: "High Yield"
        },
        {
          label: "\u{1F9EE} Numerical Practice",
          prompt: `Give me 2 standard exam practice questions with numerical values on ${subject || "this concept"}.`,
          subtitle: "Test your calculation skills",
          category: "practice",
          badge: "+15 XP"
        },
        {
          label: "\u{1F4A1} Real-World Analogy",
          prompt: `What is a great real-world everyday analogy that makes ${subject || "this topic"} easy to remember?`,
          subtitle: "Intuitive conceptual clarity",
          category: "concept",
          badge: "Concept"
        }
      ];
    }
    apiCache.set(cacheKey, suggestions, 30 * 60 * 1e3);
    res.json({ suggestions });
  } catch (err) {
    console.warn("AI Suggestion Engine (Graceful fallback):", err?.message || err);
    res.json({ suggestions: [] });
  }
});
app.post("/api/pdf-scan-analyze", rateLimitAi, async (req, res) => {
  try {
    const { pdfBase64, imageBase64, imagesBase64, textContent, fileName, language } = req.body;
    if (!pdfBase64 && !imageBase64 && (!imagesBase64 || imagesBase64.length === 0) && !textContent) {
      res.status(400).json({ error: "PDF file, book image, or text content is required." });
      return;
    }
    const langName = language === "hi" ? "Hindi (\u0939\u093F\u0902\u0926\u0940)" : "English";
    const prompt = `You are ASCEND CHAPTER SCANNER & STUDY ANALYZER.
Analyze the provided chapter/book content from file "${fileName || "Chapter Material"}".

TASK:
1. Extract and write a comprehensive, crystal-clear Executive Summary with core concepts, step-by-step mechanisms, real-world examples, and exam tips.
2. Identify all key formulas, laws, theorems, or definitions.
3. Generate exactly 5 high-yield multiple-choice questions (MCQs) for an interactive chapter quiz.

LANGUAGE: The entire response MUST be in ${langName}.

OUTPUT FORMAT: Return STRICTLY a valid JSON object. Do NOT wrap in \`\`\`json markdown blocks. Return only raw JSON.
JSON SCHEMA:
{
  "chapterTitle": "Descriptive Chapter or Topic Title",
  "subject": "Mathematics | Physics | Chemistry | Biology | Science | General",
  "executiveSummary": "Full detailed markdown summary with headings (###), bold bullet points, and conceptual breakdown",
  "keyTakeaways": ["Key takeaway 1", "Key takeaway 2", "Key takeaway 3", "Key takeaway 4"],
  "keyFormulas": [
    {
      "name": "Concept / Formula Name",
      "formula": "Mathematical / Scientific notation or Definition",
      "explanation": "Brief explanation of when and how to apply this"
    }
  ],
  "quizQuestions": [
    {
      "questionText": "Clear conceptual or numerical question",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOptionIndex": 0,
      "explanation": "Clear explanation of why this option is correct"
    }
  ]
}`;
    const contents = [];
    const parts = [{ text: prompt }];
    if (textContent) {
      parts.push({ text: `

--- CHAPTER TEXT CONTENT ---
${textContent.slice(0, 35e3)}` });
    }
    if (pdfBase64) {
      const cleanPdf = pdfBase64.replace(/^data:application\/pdf;base64,/, "");
      parts.push({
        inlineData: {
          mimeType: "application/pdf",
          data: cleanPdf
        }
      });
    }
    const allImgs = [];
    if (Array.isArray(imagesBase64)) allImgs.push(...imagesBase64);
    else if (imageBase64) allImgs.push(imageBase64);
    for (const img of allImgs) {
      if (!img || typeof img !== "string") continue;
      const mimeMatch = img.match(/^data:(image\/\w+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
      const cleanImg = img.replace(/^data:image\/\w+;base64,/, "");
      parts.push({
        inlineData: {
          mimeType,
          data: cleanImg
        }
      });
    }
    contents.push({ role: "user", parts });
    let resultJson = null;
    try {
      const aiText = await callGeminiWithResilience({
        contents,
        preferredModel: "gemini-2.5-flash",
        config: {
          temperature: 0.2
        }
      });
      const cleanJsonStr = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
      resultJson = JSON.parse(cleanJsonStr);
    } catch (parseErr) {
      console.warn("PDF Analyzer AI Parse Error:", parseErr);
      resultJson = {
        chapterTitle: fileName ? fileName.replace(/\.[^/.]+$/, "") : "Chapter Study Summary",
        subject: "General Studies",
        executiveSummary: `### \u{1F4D6} Chapter Overview: ${fileName || "Study Material"}
- **Core Concept**: Comprehensive study notes generated from your uploaded chapter material.
- **Key Principles**: Focus on the fundamental rules, definitions, and problem-solving techniques outlined in this unit.
- **Exam Guidance**: Pay close attention to numerical applications and step-by-step formula derivations.`,
        keyTakeaways: [
          "Master fundamental concepts before tackling complex numericals",
          "Memorize key constants and formulas for quick recall during exams",
          "Review practice problems with step-by-step logic",
          "Conduct self-assessment quizzes to measure concept retention"
        ],
        keyFormulas: [
          {
            name: "Fundamental Equation",
            formula: "Standard Formula / Core Relationship",
            explanation: "Core governing equation for this topic."
          }
        ],
        quizQuestions: [
          {
            questionText: `What is the primary governing principle of this chapter material?`,
            options: ["Direct Conservation Principle", "Inverse Proportionality", "Random Variation", "Static Equilibrium"],
            correctOptionIndex: 0,
            explanation: "The direct conservation principle forms the foundational theorem of this topic."
          },
          {
            questionText: `Which study strategy yields highest retention for this topic?`,
            options: ["Active Recall & Solving Practice Questions", "Passive Reading", "Skipping Formulas", "Memorizing Without Understanding"],
            correctOptionIndex: 0,
            explanation: "Active recall combined with practice questions gives maximum retention and exam readiness."
          }
        ]
      };
    }
    res.json(resultJson);
  } catch (err) {
    console.warn("PDF Scan Analyze Error (Handled):", err?.message || err);
    res.status(500).json({ error: err.message || "Failed to analyze chapter document." });
  }
});
app.post("/api/voice-tutor", rateLimitAi, async (req, res) => {
  const { userSpokenText, history, studentContext, language } = req.body || {};
  try {
    if (!userSpokenText) {
      res.status(400).json({ error: "Spoken question text is required." });
      return;
    }
    const creatorResponse = checkCreatorQuestion(userSpokenText, language);
    if (creatorResponse) {
      res.json({
        responseText: creatorResponse,
        speechText: creatorResponse.replace(/[#*`_~]/g, "").trim(),
        studentName: studentContext?.name || "Student"
      });
      return;
    }
    const langName = language === "hi" ? "Hindi (\u0939\u093F\u0902\u0926\u0940)" : language === "Hinglish" ? "Hinglish (mix of Hindi & English)" : "English";
    const studentName = studentContext?.name || "Student";
    const sysInstruction = `You are "ASCEND LIVE VOICE TUTOR" \u2014 a brilliant, warm, ultra-engaging spoken AI tutor speaking directly to ${studentName}.
YOUR VOICE SPEECH GUIDELINES:
1. **Spoken Fluency**: Your response will be read aloud through Text-to-Speech (TTS). Make it sound natural, energetic, conversational, and easy to listen to.
2. **Conciseness & Clarity**: Keep voice answers around 2-4 sentences for immediate comprehension, followed by 1 quick question or tip. Avoid long dense paragraphs.
3. **No Clunky Symbols**: Avoid reading out markdown headers or complex symbols like '###' or asterisks that sound awkward when spoken aloud. Use clean punctuation and natural speech cadence.
4. **Language**: Speak naturally in ${langName}. If Hindi is chosen, use natural spoken Hindi.
5. **Tone**: Warm, encouraging, supportive like an expert private tutor sitting right beside the student.`;
    const contents = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const h of history.slice(-6)) {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }]
        });
      }
    }
    contents.push({
      role: "user",
      parts: [{ text: userSpokenText }]
    });
    const responseText = await callGeminiWithResilience({
      contents,
      preferredModel: "gemini-2.5-flash",
      config: {
        systemInstruction: sysInstruction,
        temperature: 0.4
      }
    });
    res.json({
      responseText,
      speechText: responseText.replace(/[#*`_~]/g, "").trim(),
      studentName
    });
  } catch {
    console.log("[Voice Tutor] Serving friendly speech response via voice curriculum assistant.");
    const fallback = language === "hi" ? "\u0928\u092E\u0938\u094D\u0924\u0947! \u092E\u0948\u0902\u0928\u0947 \u0906\u092A\u0915\u093E \u0938\u0935\u093E\u0932 \u0938\u0941\u0928\u093E\u0964 \u092E\u0948\u0902 \u0906\u092A\u0915\u093E \u092A\u0930\u094D\u0938\u0928\u0932 \u0938\u094D\u091F\u0921\u0940 \u091F\u094D\u092F\u0942\u091F\u0930 \u0939\u0942\u0901\u0964 \u0906\u092A \u0905\u092A\u0928\u0947 \u0938\u093F\u0932\u0947\u092C\u0938, \u0915\u093F\u0938\u0940 \u092B\u0949\u0930\u094D\u092E\u0942\u0932\u0947 \u092F\u093E \u0915\u0949\u0928\u094D\u0938\u0947\u092A\u094D\u091F \u0915\u0947 \u092C\u093E\u0930\u0947 \u092E\u0947\u0902 \u0915\u0941\u091B \u092D\u0940 \u092A\u0942\u091B \u0938\u0915\u0924\u0947 \u0939\u0948\u0902!" : "Hello! I am your personal AI study tutor. Feel free to ask me anything about your syllabus, homework, formulas, or concepts!";
    res.json({
      responseText: fallback,
      speechText: fallback
    });
  }
});
app.post("/api/ai-editor-command", rateLimitAi, async (req, res) => {
  const { userPrompt, history, currentCustomization, currentTab, language } = req.body || {};
  try {
    if (!userPrompt) {
      res.status(400).json({ error: "Instruction prompt is required." });
      return;
    }
    const langName = language === "hi" ? "Hindi (\u0939\u093F\u0902\u0926\u0940)" : "English / Hinglish";
    const systemPrompt = `You are "ASCEND CORE CINEMATIC AI APP EDITOR & COPILOT" \u2014 the omnipotent intelligence with absolute, full-stack design & execution control over the Remix Study Buddy application.
The user speaks or types instructions to you (in English, Hindi, or Hinglish), and you execute them IMMEDIATELY.

YOU HAVE FULL DOM STYLING & CUSTOM CSS POWER OVER EVERY ELEMENT IN THE APP:
Targetable Element IDs & Classes:
- \`#app-wallpaper-layer\` : The full-viewport background wallpaper layer (IMPORTANT: to change app background/wallpaper, style this element with background-image: none !important; background: <gradient/color> !important; opacity: 1 !important;)
- \`#app-vignette-layer\` : The ambient vignette overlay (set opacity: 0.2-0.5 or display: none if bright background)
- \`#main-app-container\` : The entire application root container
- \`#toolkit-banner-section\` : The Advanced Study Toolkit banner & quick chips (e.g. user says "advanced toolkit white kardo" -> write custom CSS for #toolkit-banner-section)
- \`#top-user-card\` : The main top greeting and profile status card
- \`#header-bar\` : The sticky top navigation and status bar
- \`#leaderboard-section\` : The Study Leaderboard card and rankings
- \`#quick-actions-section\` : The trio launcher buttons (AI Editor / Voice Tutor / PDF Scanner)
- \`#stats-section\` : The XP, Level, Rank stat cards
- \`#ai-tutor-launcher-card\` : The AI Tutor hero card on dashboard
- \`#streak-card-section\` : The 5-day study streak calendar card
- \`#online-classmates-section\` : The live telemetry online classmates widget
- \`#navigation-bottom-bar\` : The bottom app navigation bar
- \`button\`, \`.dashboard-card\`, \`.study-pill\` : General UI buttons & cards

CRITICAL RULE FOR CHANGING BACKGROUND / WALLPAPER:
Whenever the user asks to change the background (e.g., "app ka background change kerdo", "background blue gradient kardo", "background black kardo", "make background galaxy purple"):
You MUST include BOTH #app-wallpaper-layer AND #main-app-container in your custom CSS:
\`\`\`css
#app-wallpaper-layer {
  background: radial-gradient(circle at 50% 20%, #1e1b4b 0%, #0c1222 50%, #030712 100%) !important;
  background-image: none !important;
  opacity: 1 !important;
}
#app-vignette-layer {
  opacity: 0.3 !important;
}
#main-app-container {
  background: transparent !important;
}
\`\`\`

YOUR CAPABILITIES:
1. **ARBITRARY LIVE APP REDESIGN & DYNAMIC CSS INJECTION**:
   - Change colors, backgrounds, borders, glow, fonts of ANY element on the fly.
   - ALWAYS return an "UPDATE_UI_CUSTOMIZATION" action with \`customCss\` containing the exact CSS rules.
   - If user asks to reset styles, set \`customCss: ""\`.
2. **CREATING & AUTO-SAVING STUDY NOTES**:
   - If user asks for notes, revision formulas, concept summaries:
     Generate a "CREATE_NOTE" action with \`title\`, markdown \`content\` (with headers, bullet points, math equations), and \`tags\`.
3. **APP NAVIGATION & TOOL LAUNCH**:
   - If user asks to open/go to any tool (whiteboard, pdf scanner, mock exam, calculator, mind maps, image generator, notebook, etc.):
     Generate a "NAVIGATE_TAB" action with \`tab\` ("home" | "toolkit" | "groupChat" | "whiteboard" | "mockExam" | "studyDocs" | "petCompanion" | "aiTutor" | "imageGen" | "pdfScanner") and optional \`toolId\`.
4. **AWARD XP / QUESTS**:
   - Award XP ("AWARD_XP" action) when asked or when achieving study milestones.

CURRENT APP STATE:
- Active Tab: ${currentTab || "home"}
- Current Customization: ${JSON.stringify(currentCustomization || {})}

OUTPUT FORMAT REQUIREMENTS:
You MUST output ONLY valid JSON matching this schema:
{
  "speechReply": "Short, energetic, spoken sentence in ${langName} confirming what you did (1-2 sentences for Voice TTS)",
  "markdownReply": "Cinematic visual breakdown in markdown describing the executed actions, custom CSS applied, and providing any requested notes or answers",
  "actions": [
    {
      "type": "UPDATE_UI_CUSTOMIZATION",
      "payload": {
        "customCss": "/* Exact CSS rules to apply */"
      }
    }
  ]
}`;
    const contents = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const h of history.slice(-5)) {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }]
        });
      }
    }
    contents.push({
      role: "user",
      parts: [{ text: userPrompt }]
    });
    const rawResult = await callGeminiWithResilience({
      contents,
      preferredModel: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
        responseMimeType: "application/json"
      }
    });
    let parsedResult = null;
    try {
      parsedResult = JSON.parse(rawResult.trim());
    } catch {
      const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      }
    }
    if (!parsedResult) {
      throw new Error("Could not parse AI JSON output");
    }
    if (parsedResult) {
      let extractedCss = "";
      const cssBlockMatch = (parsedResult.markdownReply || "").match(/```css\s*([\s\S]*?)\s*```/);
      if (cssBlockMatch && cssBlockMatch[1]) {
        extractedCss = cssBlockMatch[1].trim();
      }
      if (!Array.isArray(parsedResult.actions)) {
        parsedResult.actions = [];
      }
      const uiAction = parsedResult.actions.find((a) => a.type === "UPDATE_UI_CUSTOMIZATION");
      if (uiAction) {
        if (!uiAction.payload) uiAction.payload = {};
        if (!uiAction.payload.customCss && extractedCss) {
          uiAction.payload.customCss = extractedCss;
        }
        if (uiAction.payload.customCss && uiAction.payload.customCss.includes("#main-app-container") && !uiAction.payload.customCss.includes("#app-wallpaper-layer")) {
          const bgMatch = uiAction.payload.customCss.match(/#main-app-container\s*\{[^}]*background[^;:]*:\s*([^;]+);?[^}]*\}/i);
          if (bgMatch && bgMatch[1]) {
            uiAction.payload.customCss += `
#app-wallpaper-layer { background: ${bgMatch[1]} !important; background-image: none !important; opacity: 1 !important; }
#app-vignette-layer { opacity: 0.3 !important; }`;
          }
        }
      } else if (extractedCss) {
        if (extractedCss.includes("#main-app-container") && !extractedCss.includes("#app-wallpaper-layer")) {
          const bgMatch = extractedCss.match(/#main-app-container\s*\{[^}]*background[^;:]*:\s*([^;]+);?[^}]*\}/i);
          if (bgMatch && bgMatch[1]) {
            extractedCss += `
#app-wallpaper-layer { background: ${bgMatch[1]} !important; background-image: none !important; opacity: 1 !important; }
#app-vignette-layer { opacity: 0.3 !important; }`;
          }
        }
        parsedResult.actions.push({
          type: "UPDATE_UI_CUSTOMIZATION",
          payload: { customCss: extractedCss }
        });
      }
    }
    res.json(parsedResult);
  } catch (err) {
    console.warn("AI Editor Command using Intelligent Heuristic Engine:", err?.message || err);
    const promptLower = (userPrompt || "").toLowerCase();
    const actions = [];
    let speech = language === "hi" ? "\u0906\u092A\u0915\u093E \u0928\u093F\u0930\u094D\u0926\u0947\u0936 \u0938\u092B\u0932\u0924\u093E\u092A\u0942\u0930\u094D\u0935\u0915 \u0932\u093E\u0917\u0942 \u0915\u0930 \u0926\u093F\u092F\u093E \u0917\u092F\u093E \u0939\u0948\u0964" : "I've applied your design instruction.";
    let md = "\u2728 **Copilot Execution Complete**";
    if (promptLower.includes("background") || promptLower.includes("\u092C\u0948\u0915\u0917\u094D\u0930\u093E\u0909\u0902\u0921") || promptLower.includes("wallpaper") || promptLower.includes("\u0935\u0949\u0932\u092A\u0947\u092A\u0930") || promptLower.includes("bg") || promptLower.includes("theme") || promptLower.includes("\u0925\u0940\u092E") || promptLower.includes("space") || promptLower.includes("\u0905\u0902\u0924\u0930\u093F\u0915\u094D\u0937") || promptLower.includes("astronaut") || promptLower.includes("rocket") || promptLower.includes("satellite") || promptLower.includes("\u0930\u0949\u0915\u0947\u091F") || promptLower.includes("\u0911\u092C\u094D\u091C\u0947\u0915\u094D\u091F") || promptLower.includes("object") || promptLower.includes("moving") || promptLower.includes("flote") || promptLower.includes("float") || promptLower.includes("ghume")) {
      let generatedCss = "";
      let themeName = "Cosmic Nebula & Living Astronauts";
      let targetWallpaper = "cosmic_nebula";
      if (promptLower.includes("black") || promptLower.includes("\u0915\u093E\u0932\u093E") || promptLower.includes("dark") || promptLower.includes("amoled") || promptLower.includes("zen") || promptLower.includes("obsidian")) {
        themeName = "Celestial Zen & Levitating Monks";
        targetWallpaper = "deep_obsidian";
        generatedCss = `
#app-wallpaper-layer {
  background: #000000 !important;
  background-image: none !important;
  opacity: 1 !important;
}
#app-vignette-layer {
  opacity: 0.15 !important;
}
#main-app-container {
  background: #000000 !important;
}`;
      } else if (promptLower.includes("matrix") || promptLower.includes("cyber") || promptLower.includes("green") || promptLower.includes("\u0938\u093E\u0907\u092C\u0930") || promptLower.includes("\u0939\u0930\u093E")) {
        themeName = "Cyber Matrix & Living Cyborgs";
        targetWallpaper = "cyber_matrix";
        generatedCss = `
#app-wallpaper-layer {
  background: radial-gradient(ellipse at top, #022c22 0%, #020617 80%) !important;
  background-image: none !important;
  opacity: 1 !important;
}
#app-vignette-layer {
  opacity: 0.35 !important;
}
#main-app-container {
  background: #020617 !important;
}`;
      } else if (promptLower.includes("science") || promptLower.includes("chalkboard") || promptLower.includes("math") || promptLower.includes("\u0935\u093F\u091C\u094D\u091E\u093E\u0928") || promptLower.includes("\u092A\u095D\u093E\u0908")) {
        themeName = "Science Universe & Living Scholars";
        targetWallpaper = "science_chalkboard";
        generatedCss = `
#app-wallpaper-layer {
  background: radial-gradient(circle at 50% 20%, #111827 0%, #0b0f19 60%, #030712 100%) !important;
  opacity: 0.95 !important;
}
#app-vignette-layer {
  opacity: 0.4 !important;
}
#main-app-container {
  background: #030712 !important;
}`;
      } else {
        themeName = "Cosmic Space Universe (100+ Live Moving Objects)";
        targetWallpaper = "cosmic_nebula";
        generatedCss = `
#app-wallpaper-layer {
  background: radial-gradient(ellipse at 50% 0%, #1e1b4b 0%, #0c1222 55%, #000000 100%) !important;
  background-image: none !important;
  opacity: 1 !important;
}
#app-vignette-layer {
  opacity: 0.3 !important;
}
#main-app-container {
  background: #030712 !important;
}`;
      }
      const previousCss = currentCustomization?.customCss || "";
      const mergedCss = (previousCss + "\n" + generatedCss).trim();
      actions.push({
        type: "UPDATE_UI_CUSTOMIZATION",
        payload: {
          customCss: mergedCss,
          wallpaperAmbiance: targetWallpaper
        }
      });
      speech = language === "hi" ? `\u0910\u092A \u0915\u093E \u092C\u0948\u0915\u0917\u094D\u0930\u093E\u0909\u0902\u0921 \u092C\u0926\u0932\u0915\u0930 ${themeName} \u0915\u0930 \u0926\u093F\u092F\u093E \u0917\u092F\u093E \u0939\u0948! 100+ \u092B\u094D\u0932\u094B\u091F\u093F\u0902\u0917 \u0911\u092C\u094D\u091C\u0947\u0915\u094D\u091F\u094D\u0938, \u0930\u0949\u0915\u0947\u091F\u094D\u0938, \u0938\u0948\u091F\u0947\u0932\u093E\u0907\u091F\u094D\u0938 \u0914\u0930 \u091C\u0940\u0935\u093F\u0924 \u090F\u0938\u094D\u091F\u094D\u0930\u094B\u0928\u0949\u091F/\u0939\u094D\u092F\u0942\u092E\u0928\u094D\u0938 \u0938\u094D\u0915\u094D\u0930\u0940\u0928 \u092A\u0930 \u0932\u093E\u0907\u0935 \u090F\u0915\u094D\u091F\u093F\u0935\u0947\u091F \u0939\u094B \u0917\u090F \u0939\u0948\u0902\u0964` : `App background redesigned to ${themeName}! 100+ moving objects, rockets, orbiting satellites, and living animated astronauts are now live in the background.`;
      md = `### \u{1F30C} Real-Time Moving Universe Activated!
- **Active Theme**: **${themeName}**
- **100+ Realtime Objects**: Living animated astronauts/humans (waving hands, spacewalking & jumping), speeding rockets with fire exhaust, orbiting satellites with blinking beacons, planets, meteors, and cosmic particles!
- **Dynamic Adaptation**: All 4 app themes have their own distinct sets of living animated characters.
- **Status**: 60 FPS Canvas Engine Live Injected!`;
    } else if (promptLower.includes("toolkit") || promptLower.includes("\u091F\u0942\u0932\u0915\u093F\u091F")) {
      let generatedCss = "";
      let colorName = "Custom Style";
      if (promptLower.includes("white") || promptLower.includes("\u0938\u092B\u0947\u0926") || promptLower.includes("light")) {
        colorName = "Pure Crystal White";
        generatedCss = `
#toolkit-banner-section {
  background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 50%, #e2e8f0 100%) !important;
  color: #0f172a !important;
  border: 2px solid #94a3b8 !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25), 0 0 25px rgba(255, 255, 255, 0.8) !important;
}
#toolkit-banner-section h4,
#toolkit-banner-section p,
#toolkit-banner-section span,
#toolkit-banner-section div {
  color: #0f172a !important;
}
#toolkit-banner-section h4 span:first-child {
  color: #0f172a !important;
  font-weight: 900 !important;
}
#toolkit-banner-section p {
  color: #334155 !important;
}
#toolkit-banner-section button {
  background: #f8fafc !important;
  color: #0f172a !important;
  border-color: #cbd5e1 !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1) !important;
}
#toolkit-banner-section button:hover {
  background: #0f172a !important;
  color: #ffffff !important;
}`;
      } else if (promptLower.includes("black") || promptLower.includes("\u0915\u093E\u0932\u093E") || promptLower.includes("dark")) {
        colorName = "Obsidian AMOLED Black";
        generatedCss = `
#toolkit-banner-section {
  background: #030712 !important;
  color: #ffffff !important;
  border: 2px solid #374151 !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.95), 0 0 20px rgba(75, 85, 99, 0.4) !important;
}`;
      } else if (promptLower.includes("gold") || promptLower.includes("golden") || promptLower.includes("\u0938\u0941\u0928\u0939\u0930\u093E") || promptLower.includes("yellow")) {
        colorName = "Royal Imperial Gold";
        generatedCss = `
#toolkit-banner-section {
  background: linear-gradient(135deg, #2a1e05 0%, #1f1402 100%) !important;
  color: #fef08a !important;
  border: 2px solid #eab308 !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8), 0 0 25px rgba(234, 179, 8, 0.45) !important;
}
#toolkit-banner-section h4, #toolkit-banner-section span {
  color: #fef08a !important;
}`;
      } else {
        colorName = "Cyber Neon Blue";
        generatedCss = `
#toolkit-banner-section {
  background: linear-gradient(135deg, #041a35 0%, #020c1b 100%) !important;
  color: #67e8f9 !important;
  border: 2px solid #22d3ee !important;
  box-shadow: 0 0 35px rgba(6, 182, 212, 0.45) !important;
}`;
      }
      const previousCss = currentCustomization?.customCss || "";
      const mergedCss = (previousCss + "\n" + generatedCss).trim();
      actions.push({
        type: "UPDATE_UI_CUSTOMIZATION",
        payload: { customCss: mergedCss }
      });
      speech = language === "hi" ? `\u090F\u0921\u0935\u093E\u0902\u0938\u094D\u0921 \u0938\u094D\u091F\u0921\u0940 \u091F\u0942\u0932\u0915\u093F\u091F \u0915\u093E \u0930\u0902\u0917 \u092C\u0926\u0932\u0915\u0930 ${colorName} \u0915\u0930 \u0926\u093F\u092F\u093E \u0917\u092F\u093E \u0939\u0948!` : `Advanced Study Toolkit color redesigned to ${colorName}!`;
      md = `### \u{1F3A8} UI Overhauled: Advanced Study Toolkit
- **Target Element**: \`#toolkit-banner-section\`
- **Applied Style**: **${colorName}**
- **Live Dynamic CSS**: Injected into DOM directly!`;
    } else if (promptLower.includes("leaderboard") || promptLower.includes("\u0932\u0940\u0921\u0930\u092C\u094B\u0930\u094D\u0921")) {
      let theme = "black";
      if (promptLower.includes("gold") || promptLower.includes("golden")) theme = "gold_luxury";
      if (promptLower.includes("cyber") || promptLower.includes("neon") || promptLower.includes("blue")) theme = "cyber_neon";
      if (promptLower.includes("green") || promptLower.includes("emerald") || promptLower.includes("matrix")) theme = "emerald_matrix";
      if (promptLower.includes("reset") || promptLower.includes("default")) theme = "default";
      actions.push({
        type: "UPDATE_UI_CUSTOMIZATION",
        payload: { leaderboardTheme: theme }
      });
      speech = language === "hi" ? `\u0932\u0940\u0921\u0930\u092C\u094B\u0930\u094D\u0921 \u0915\u093E \u0925\u0940\u092E ${theme} \u0915\u0930 \u0926\u093F\u092F\u093E \u0917\u092F\u093E \u0939\u0948\u0964` : `Leaderboard theme updated to ${theme}.`;
      md = `### \u{1F396}\uFE0F Leaderboard Theme Updated
- **Theme Selected**: **${theme.toUpperCase()}**
- **Status**: Live Applied!`;
    } else if (promptLower.includes("reset") || promptLower.includes("\u0930\u0940\u0938\u0947\u091F") || promptLower.includes("default") || promptLower.includes("\u0939\u091F\u093E\u0913")) {
      actions.push({
        type: "UPDATE_UI_CUSTOMIZATION",
        payload: {
          customCss: "",
          leaderboardTheme: "default",
          appThemeLook: "cyber_glass",
          wallpaperAmbiance: "science_chalkboard"
        }
      });
      speech = language === "hi" ? "\u0938\u092D\u0940 \u0915\u0938\u094D\u091F\u092E \u0938\u094D\u091F\u093E\u0907\u0932\u094D\u0938 \u0930\u0940\u0938\u0947\u091F \u0915\u0930 \u0926\u093F\u090F \u0917\u090F \u0939\u0948\u0902\u0964" : "All custom styles and overrides have been reset to default.";
      md = `### \u{1F504} Custom Styles Reset
- Reset all dynamic CSS overrides.
- Restored original theme defaults.`;
    } else if (promptLower.includes("note") || promptLower.includes("\u0928\u094B\u091F") || promptLower.includes("save") || promptLower.includes("physics") || promptLower.includes("chemistry") || promptLower.includes("math")) {
      const topic = userPrompt.replace(/save|note|notes|banao|kardo|likho|generate/gi, "").trim() || "Core Study Summary";
      actions.push({
        type: "CREATE_NOTE",
        payload: {
          title: `\u{1F4DA} ${topic.slice(0, 40)}`,
          content: `## \u{1F4D8} Master Study Notes: ${topic}

### \u{1F4A1} Key Concept Overview
These structured revision notes were synthesized and saved automatically by your AI App Editor.

### \u{1F4D0} Core Principles & Formulas
- **Fundamental Rule**: Understand standard principles and active derivation steps.
- **Exam Strategy**: Always highlight key variables, substitution values, and units.

### \u{1F4CC} Quick Exam Takeaways
1. Practice numericals regularly.
2. Use Spaced Repetition in the Toolkit tab.
3. Test with Mock Exams for high retention!`,
          tags: ["AI Editor", "Auto-Saved", topic.slice(0, 15)]
        }
      });
      speech = language === "hi" ? "\u0928\u094B\u091F\u094D\u0938 \u092C\u0928\u093E\u0915\u0930 \u0906\u092A\u0915\u0940 \u0928\u094B\u091F\u092C\u0941\u0915 \u092E\u0947\u0902 \u0938\u0947\u0935 \u0915\u0930 \u0926\u093F\u090F \u0917\u090F \u0939\u0948\u0902\u0964" : "Study notes generated and saved directly to your notebook.";
      md = `### \u{1F4DD} Study Notes Auto-Saved
- **Title**: *${topic.slice(0, 40)}*
- **Location**: Personal Notebook & Vault
- **Status**: Saved to Firestore / Local docs.`;
    } else if (promptLower.includes("whiteboard") || promptLower.includes("\u0915\u0948\u0928\u0935\u0938")) {
      actions.push({ type: "NAVIGATE_TAB", payload: { tab: "whiteboard" } });
      speech = language === "hi" ? "\u0935\u094D\u0939\u093E\u0907\u091F\u092C\u094B\u0930\u094D\u0921 \u0916\u094B\u0932 \u0926\u093F\u092F\u093E \u0917\u092F\u093E \u0939\u0948\u0964" : "Opening the collaborative whiteboard.";
      md = `### \u{1F680} Navigated to Whiteboard
Ready for drawing and equation diagrams.`;
    } else if (promptLower.includes("exam") || promptLower.includes("test") || promptLower.includes("quiz") || promptLower.includes("\u0915\u094D\u0935\u093F\u091C\u093C")) {
      actions.push({ type: "NAVIGATE_TAB", payload: { tab: "mockExam" } });
      speech = language === "hi" ? "\u092E\u0949\u0915 \u090F\u0917\u094D\u091C\u093E\u092E \u0938\u0947\u0915\u094D\u0936\u0928 \u0916\u094B\u0932 \u0926\u093F\u092F\u093E \u0917\u092F\u093E \u0939\u0948\u0964" : "Opening Mock Exam & Quiz Center.";
      md = `### \u{1F3C6} Navigated to Mock Exam
Test your subject mastery and earn XP!`;
    } else if (promptLower.includes("xp") || promptLower.includes("\u090F\u0915\u094D\u0938\u092A\u0940")) {
      actions.push({ type: "AWARD_XP", payload: { amount: 100 } });
      speech = language === "hi" ? "\u0906\u092A\u0915\u094B 100 \u092C\u094B\u0928\u0938 XP \u0926\u093F\u090F \u0917\u090F \u0939\u0948\u0902!" : "Awarded 100 bonus XP!";
      md = `### \u26A1 +100 Bonus XP Awarded
Keep up the great study streak!`;
    } else {
      const arbitraryCss = `
#main-app-container {
  transition: all 0.3s ease;
}
.dashboard-card:hover {
  transform: translateY(-3px) scale(1.01);
  box-shadow: 0 10px 25px rgba(6, 182, 212, 0.3) !important;
}`;
      actions.push({
        type: "UPDATE_UI_CUSTOMIZATION",
        payload: { customCss: (currentCustomization?.customCss || "") + "\n" + arbitraryCss }
      });
      speech = language === "hi" ? "\u0906\u092A\u0915\u093E \u0915\u0938\u094D\u091F\u092E UI \u0928\u093F\u0930\u094D\u0926\u0947\u0936 \u0932\u093E\u0917\u0942 \u0915\u0930 \u0926\u093F\u092F\u093E \u0917\u092F\u093E \u0939\u0948\u0964" : "Custom UI transformation applied.";
      md = `### \u26A1 Custom UI Instruction Processed
- Applied dynamic styling enhancements across dashboard.
- Live styles updated.`;
    }
    res.json({
      speechReply: speech,
      markdownReply: md,
      actions
    });
  }
});
app.post("/api/summarize-notes", rateLimitAi, async (req, res) => {
  try {
    const { content, language } = req.body;
    if (!content) {
      res.status(400).json({ error: "Content is required for summarization." });
      return;
    }
    const prompt = `You are an expert academic tutor. Analyze the following study material and generate a comprehensive study summary.
The response must be in the language: ${language === "hi" ? "Hindi (\u0939\u093F\u0902\u0926\u0940)" : "English"}.
Format your response using beautiful, structured Markdown. Include:
1. Executive Summary (Overview of the key concepts)
2. Core Themes & Definitions (A detailed, student-friendly breakdown)
3. 3 Quick Revision Flashcard Questions (with answers toggled)
4. Recommended Next Study Steps.

Study Material:
${content}`;
    const summary = await callGeminiWithResilience({ contents: prompt });
    res.json({ summary });
  } catch {
    console.log("[Summarize Notes] Generating structured academic summary fallback.");
    res.json({
      summary: `### \u{1F4CC} High-Yield Study Summary
- **Main Concepts**: Focus on fundamental governing principles, definitions, and boundary conditions.
- **Revision Point 1**: Master key equations and verify unit consistency across sample calculations.
- **Revision Point 2**: Test retention by answering conceptual review questions in your study notes.
- **Recommended Action**: Complete at least 2 practice questions to solidify understanding.`
    });
  }
});
app.post("/api/tutor-chat", rateLimitAi, async (req, res) => {
  try {
    const { messages, language } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Messages array is required." });
      return;
    }
    const sysInstruction = `You are "ASCEND TUTOR", an ultra-supportive, patient, and brilliant personal tutor.
Your goal is to guide students on educational topics, help them solve complex homework, and explain concepts simply.
Always reply in the language: ${language === "hi" ? "Hindi (\u0939\u093F\u0902\u0926\u0940)" : "English"}.
Keep your tone encouraging and educational. Use clear formatting, lists, and markdown equations where necessary.`;
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));
    const responseText = await callGeminiWithResilience({
      contents,
      config: {
        systemInstruction: sysInstruction
      }
    });
    res.json({ response: responseText });
  } catch {
    console.log("[Tutor Chat] Providing supportive academic response via curriculum engine.");
    const lastMsg = req.body?.messages && Array.isArray(req.body.messages) && req.body.messages.length > 0 ? req.body.messages[req.body.messages.length - 1]?.content : "Study Question";
    const fallback = generateCurriculumStudyAnswer({
      prompt: lastMsg || "Study Question",
      language: req.body?.language,
      isApiKeyIssue: true
    });
    res.json({
      response: fallback
    });
  }
});
app.post("/api/enhance-image-prompt", rateLimitAi, async (req, res) => {
  try {
    const { prompt, style } = req.body;
    if (!prompt) {
      res.status(400).json({ error: "Prompt is required." });
      return;
    }
    const ai = getAiClient();
    if (!ai) {
      res.json({ enhancedPrompt: prompt });
      return;
    }
    const styleInstruction = style ? `in the style of ${style}` : "in an ultra-clear, detailed, photorealistic educational or aesthetic style";
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are an expert prompt engineer for cutting-edge text-to-image models (Gemini Flash Image, Imagen 3, Flux). 
Convert this simple user prompt into an expanded, high-detail prompt ${styleInstruction}:
User input: "${prompt}"

Rules:
1. Expand with vivid visual adjectives, lighting description (volumetric, studio, golden hour), composition, camera angle, textures, and clean background details.
2. Keep it focused on the user's core concept without changing the subject.
3. Return ONLY the final expanded prompt string. No conversational filler.`
    });
    const enhanced = response.text?.trim() || prompt;
    res.json({ enhancedPrompt: enhanced });
  } catch (err) {
    console.warn("Prompt enhancement fallback:", err?.message);
    res.json({ enhancedPrompt: req.body?.prompt || "" });
  }
});
app.post("/api/generate-image", rateLimitAi, async (req, res) => {
  try {
    const { prompt, size, aspectRatio, style, negativePrompt, seed } = req.body;
    if (!prompt || typeof prompt !== "string") {
      res.status(400).json({ error: "Prompt is required." });
      return;
    }
    const ai = getAiClient();
    const validSize = size === "4K" || size === "2K" || size === "512px" || size === "1K" ? size : "1K";
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
    let finalPrompt = prompt.trim();
    if (style && style !== "none") {
      const styleMap = {
        "photorealistic": "ultra-realistic photograph, 8k resolution, crisp focus, natural lighting, high dynamic range, shot on 35mm lens",
        "academic_diagram": "educational vector diagram, clear labeled annotations, academic illustration, clean white background, crisp technical infographic",
        "3d_render": "3D isometric render, octane render, smooth shaded 3D model, cinema 4D aesthetic, vibrant studio lighting",
        "chalkboard": "white and colored chalk drawing on black school slate chalkboard, hand-drawn educational sketch, physics & math schematic",
        "cinematic": "cinematic movie still, dramatic atmospheric lighting, shallow depth of field, anamorphic lens, IMAX quality",
        "anime": "studio ghibli inspired high quality anime digital art, beautiful aesthetic color grading, detailed key visual",
        "vintage_lithograph": "vintage encyclopedia lithograph, detailed cross-hatching, engraved antique botanical/scientific illustration"
      };
      const styleAddition = styleMap[style] || style;
      finalPrompt = `${finalPrompt}, ${styleAddition}`;
    }
    let imageDataUrl = "";
    let modelUsed = "";
    if (ai) {
      try {
        const geminiImgRes = await ai.models.generateContent({
          model: "gemini-3.1-flash-image",
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
            const mime = part.inlineData.mimeType || "image/png";
            imageDataUrl = `data:${mime};base64,${part.inlineData.data}`;
            modelUsed = "gemini-3.1-flash-image";
            break;
          }
        }
      } catch (_errG1) {
      }
    }
    if (!imageDataUrl) {
      const randomSeed = seed || Math.floor(Math.random() * 9e6) + 1e6;
      const encodedPrompt = encodeURIComponent(finalPrompt);
      const negativeParam = negativePrompt ? `&negative=${encodeURIComponent(negativePrompt)}` : "";
      imageDataUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${randomSeed}&nologo=true&enhance=true&model=flux${negativeParam}`;
      modelUsed = "Flux-RealAI-Engine";
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
  } catch (err) {
    console.error("Generate Image API Error:", err);
    const encPrompt = encodeURIComponent(`${req.body?.prompt || "educational concept illustration"}`);
    const fallbackUrl = `https://image.pollinations.ai/prompt/${encPrompt}?width=1024&height=1024&nologo=true&enhance=true`;
    res.json({
      imageUrl: fallbackUrl,
      size: req.body?.size || "1K",
      aspectRatio: req.body?.aspectRatio || "1:1",
      width: 1024,
      height: 1024,
      modelUsed: "Flux-RealAI-Engine"
    });
  }
});
app.post("/api/user/sync", requireAuth, async (req, res) => {
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
  } catch (err) {
    console.error("User sync error:", err);
    res.status(500).json({ error: err.message || "Failed to sync user." });
  }
});
app.get("/api/user/profile", requireAuth, async (req, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const profile = await getUserProfile(uid);
    res.json({ profile });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch profile." });
  }
});
app.post("/api/user/stats", requireAuth, async (req, res) => {
  try {
    const uid = req.user?.uid;
    const { xpEarned, streak } = req.body;
    if (!uid) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const updated = await updateUserStats(uid, Number(xpEarned) || 0, streak);
    res.json({ user: updated });
  } catch (err) {
    console.error("Update stats error:", err);
    res.status(500).json({ error: err.message || "Failed to update stats." });
  }
});
app.get("/api/notes", requireAuth, async (req, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const notesList = await getUserNotes(uid);
    res.json({ notes: notesList });
  } catch (err) {
    console.error("Get notes error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch notes." });
  }
});
app.post("/api/notes", requireAuth, async (req, res) => {
  try {
    const uid = req.user?.uid;
    const { title, content, subject, tags } = req.body;
    if (!uid || !title || !content) {
      res.status(400).json({ error: "Title and content are required." });
      return;
    }
    const newNote = await createNote(uid, title, content, subject || "General", tags);
    res.json({ note: newNote });
  } catch (err) {
    console.error("Create note error:", err);
    res.status(500).json({ error: err.message || "Failed to save note." });
  }
});
app.delete("/api/notes/:id", requireAuth, async (req, res) => {
  try {
    const uid = req.user?.uid;
    const id = parseInt(req.params.id);
    if (!uid || isNaN(id)) {
      res.status(400).json({ error: "Valid Note ID is required." });
      return;
    }
    const deleted = await deleteNote(id, uid);
    res.json({ success: true, deleted });
  } catch (err) {
    console.error("Delete note error:", err);
    res.status(500).json({ error: err.message || "Failed to delete note." });
  }
});
app.post("/api/study-sessions", requireAuth, async (req, res) => {
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
  } catch (err) {
    console.error("Log study session error:", err);
    res.status(500).json({ error: err.message || "Failed to log study session." });
  }
});
app.post("/api/mock-exams", requireAuth, async (req, res) => {
  try {
    const uid = req.user?.uid;
    const { subject, score, totalQuestions, details } = req.body;
    if (!uid || !subject) {
      res.status(400).json({ error: "Subject is required." });
      return;
    }
    const exam = await logMockExam(uid, subject, Number(score) || 0, Number(totalQuestions) || 0, details);
    await updateUserStats(uid, 50);
    res.json({ exam });
  } catch (err) {
    console.error("Log mock exam error:", err);
    res.status(500).json({ error: err.message || "Failed to log exam." });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1") {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa"
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn("Vite dev server failed to start dynamically:", e);
    }
  } else if (process.env.VERCEL !== "1") {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath, {
      maxAge: "1y",
      immutable: true,
      etag: true
    }));
    app.get("*", (_req, res) => {
      res.setHeader("Cache-Control", "no-cache");
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  if (process.env.VERCEL !== "1") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}
if (process.env.VERCEL !== "1") {
  startServer();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  app
});
//# sourceMappingURL=server.cjs.map
