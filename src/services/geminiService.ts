import { API_BASE } from "../config/apiConfig";

export let isAiQuotaExceeded = false;
export let lastAiErrorMessage: string | null = null;

export interface AiUsageData {
  date: string;
  count: number;
  limit: number;
}

export interface ToolkitUsageData {
  date: string;
  count: number;
  limit: number;
}

export function getDailyAiUsage(): AiUsageData {
  if (typeof window === "undefined") {
    return { date: "", count: 0, limit: 999999 };
  }
  const todayStr = new Date().toISOString().split("T")[0];
  const stored = localStorage.getItem("studybuddy_daily_ai_usage");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.date === todayStr) {
        return { date: todayStr, count: parsed.count || 0, limit: 999999 };
      }
    } catch (e) {
      console.error("Failed to parse daily AI usage", e);
    }
  }
  // Initialize or reset for the new day
  const initial: AiUsageData = { date: todayStr, count: 0, limit: 999999 };
  localStorage.setItem("studybuddy_daily_ai_usage", JSON.stringify(initial));
  return initial;
}

export function incrementDailyAiUsage(): AiUsageData {
  if (typeof window === "undefined") {
    return { date: "", count: 0, limit: 999999 };
  }
  const current = getDailyAiUsage();
  current.count += 1;
  localStorage.setItem("studybuddy_daily_ai_usage", JSON.stringify(current));
  
  // Dispatch custom event so UI components can update React state automatically!
  window.dispatchEvent(new CustomEvent("ai-usage-updated", { detail: current }));
  
  return current;
}

export function getToolkitUsage(): ToolkitUsageData {
  if (typeof window === "undefined") {
    return { date: "", count: 0, limit: 50 };
  }
  const todayStr = new Date().toISOString().split("T")[0];
  const stored = localStorage.getItem("studybuddy_toolkit_usage");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.date === todayStr) {
        return { date: todayStr, count: parsed.count || 0, limit: 50 };
      }
    } catch (e) {
      console.error("Failed to parse toolkit usage", e);
    }
  }
  // Initialize or reset for the new day
  const initial: ToolkitUsageData = { date: todayStr, count: 0, limit: 50 };
  localStorage.setItem("studybuddy_toolkit_usage", JSON.stringify(initial));
  return initial;
}

export function incrementToolkitUsage(): ToolkitUsageData {
  if (typeof window === "undefined") {
    return { date: "", count: 0, limit: 50 };
  }
  const current = getToolkitUsage();
  current.count += 1;
  localStorage.setItem("studybuddy_toolkit_usage", JSON.stringify(current));
  
  // Dispatch custom event so UI components can update React state automatically!
  window.dispatchEvent(new CustomEvent("toolkit-usage-updated", { detail: current }));
  
  return current;
}

export function setAiQuotaExceeded(val: boolean, msg: string | null = null) {
  isAiQuotaExceeded = val;
  lastAiErrorMessage = msg;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ai-quota-state-changed", { detail: { exceeded: val, message: msg } }));
  }
}

// Local Cache System for high durability
export function getLocalCache(category: string, country: string, topic: string, additionalKey?: string): any | null {
  try {
    const key = `sb_durability_cache_${category}_${country}_${topic}_${additionalKey || ''}`;
    const cached = localStorage.getItem(key);
    if (cached) {
      console.log(`[Durability Cache Hit] Instantly loaded ${category} for ${country}/${topic} from cache.`);
      return JSON.parse(cached);
    }
  } catch (e) {
    console.warn("Failed to read from local cache", e);
  }
  return null;
}

export function setLocalCache(category: string, country: string, topic: string, additionalKey: string, data: any) {
  try {
    const key = `sb_durability_cache_${category}_${country}_${topic}_${additionalKey || ''}`;
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`[Durability Cache Store] Saved ${category} for ${country}/${topic} into cache.`);
  } catch (e) {
    console.warn("Failed to write to local cache", e);
  }
}

const inFlightRequests = new Map<string, Promise<Response>>();

// Safe custom fetch wrapper with built-in localized caching for notes & AI tools
export async function safeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === "string" ? input : (input as any).url || "";
  const isPost = init?.method === "POST";
  
  // Identify if this is a cacheable educational study notes/tools endpoint
  const cacheableEndpoints = [
    "/api/gemini/notes-generator",
    "/api/summarize-notes",
    "/api/gemini/explain-topic",
    "/api/gemini/mindmap",
    "/api/gemini/question-paper",
    "/api/gemini/pdf-summary"
  ];
  
  const isCacheable = cacheableEndpoints.some(ep => url.includes(ep));
  
  let country = "Global";
  try {
    const profileStr = localStorage.getItem('studybuddy_local_profile');
    if (profileStr) {
      const parsed = JSON.parse(profileStr);
      if (parsed && parsed.country) country = parsed.country;
    }
  } catch (e) {}

  let bodyObj: any = null;
  let cacheKey = "";
  if (isPost && isCacheable && init?.body) {
    try {
      bodyObj = JSON.parse(init.body as string);
      // Construct a unique cache key based on country, endpoint and body params
      const endpointName = url.split("/").pop() || "tool";
      const bodyStr = JSON.stringify(bodyObj);
      cacheKey = `sb_notes_cache_${country}_${endpointName}_${bodyStr}`;
      
      const cachedResponseText = localStorage.getItem(cacheKey);
      if (cachedResponseText) {
        console.log(`[Cache Hit - safeFetch] Returning cached study notes instantly for ${cacheKey}`);
        return new Response(cachedResponseText, {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
    } catch (err) {
      console.warn("Failed to check safeFetch cache", err);
    }
  }

  // Deduplicate identical parallel requests (especially post requests with payloads)
  let dedupeKey = "";
  if (isPost && init?.body) {
    try {
      dedupeKey = `${url}_${init.body as string}`;
      if (inFlightRequests.has(dedupeKey)) {
        console.log(`[Deduplication - safeFetch] Joining in-flight request for: ${url}`);
        const existingPromise = inFlightRequests.get(dedupeKey);
        if (existingPromise) {
          const res = await existingPromise;
          return res.clone();
        }
      }
    } catch (e) {}
  }

  // Define the core fetch promise
  const executeFetch = async (): Promise<Response> => {
    // Add Firebase Auth ID token if available
    let idToken: string | null = null;
    try {
      const { auth } = await import("./firebase");
      if (auth.currentUser) {
        idToken = await auth.currentUser.getIdToken();
      }
    } catch (e) {
      // Ignore if auth is not loaded or fails
    }

    const modifiedInit = { ...(init || {}) };
    if (idToken) {
      const headers = new Headers(modifiedInit.headers || {});
      headers.set("Authorization", `Bearer ${idToken}`);
      modifiedInit.headers = headers;
    }

    const resolvedInput = typeof input === "string" && input.startsWith("/api/")
      ? `${API_BASE}${input}`
      : input;

    const controller = !modifiedInit.signal ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 15000) : null;
    if (controller) {
      modifiedInit.signal = controller.signal;
    }

    let response: Response;
    try {
      response = await fetch(resolvedInput, modifiedInit);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }

    try {
      const isAiEndpoint = url.includes("/api/gemini/") || url.includes("generativelanguage.googleapis.com");
      if (isAiEndpoint && response.ok) {
        incrementDailyAiUsage();
      }
      const quotaHeader = response.headers.get("x-gemini-quota-exceeded");
      if (quotaHeader === "true") {
        setAiQuotaExceeded(true, "Quota Exceeded on AI Studio / Cloud project.");
      } else if (response.ok && isAiEndpoint) {
        // Clear quota state upon verified successful live response!
        setAiQuotaExceeded(false, null);
      }

      // Save to cache if successful
      if (response.ok && isPost && isCacheable && cacheKey) {
        const clone = response.clone();
        const text = await clone.text();
        localStorage.setItem(cacheKey, text);
        console.log(`[Cache Store - safeFetch] Saved study notes result to ${cacheKey}`);
      }
    } catch (e) {
      // Ignore caching and header errors
    }
    return response;
  };

  if (dedupeKey) {
    const promise = executeFetch();
    inFlightRequests.set(dedupeKey, promise);
    try {
      const res = await promise;
      return res.clone();
    } finally {
      inFlightRequests.delete(dedupeKey);
    }
  }

  return executeFetch();
}

/**
 * Highly resilient JSON cleaner and parser helper.
 * Strips markdown json blocks, comments, and handles partial or malformed responses.
 */
export function cleanAndParseJson<T>(text: string, fallback: T): T {
  if (!text) return fallback;
  let cleaned = text.trim();
  // Strip Markdown JSON/text block syntax if wrapped
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json|text|)?\s*/i, "").replace(/\s*```$/, "");
  }
  cleaned = cleaned.trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    // Try to find first open bracket/brace to extract valid JSON
    try {
      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");
      const firstBracket = cleaned.indexOf("[");
      const lastBracket = cleaned.lastIndexOf("]");
      
      if (firstBrace !== -1 && lastBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        const sliced = cleaned.slice(firstBrace, lastBrace + 1);
        return JSON.parse(sliced) as T;
      } else if (firstBracket !== -1 && lastBracket !== -1) {
        const sliced = cleaned.slice(firstBracket, lastBracket + 1);
        return JSON.parse(sliced) as T;
      }
    } catch (innerErr) {
      console.warn("[JSON Parse Repair Failed]", innerErr);
    }
    console.warn("[cleanAndParseJson] Resilient fallback invoked due to parse error:", err, "Original text snippet:", text.slice(0, 120));
    return fallback;
  }
}

export async function getStudyAnswer(
  prompt: string, 
  imageBase64?: string | string[], 
  studentContext?: { name: string; school: string; className: string; country?: string; memory?: any }, 
  language: string = "English",
  persona: 'default' | 'socratic' | 'debugger' | 'translator' | 'math' = 'default',
  history?: { role: 'user' | 'model', text: string }[]
): Promise<string> {
  const cleanPrompt = typeof prompt === 'string' ? prompt : String(prompt || '');

  const cleanHistory = Array.isArray(history) 
    ? history.map(h => ({ role: h.role === 'user' ? ('user' as const) : ('model' as const), text: typeof h.text === 'string' ? h.text : String(h.text || '') }))
    : undefined;

  const imagesArray = Array.isArray(imageBase64)
    ? imageBase64
    : imageBase64
    ? [imageBase64]
    : [];

  const response = await safeFetch("/api/gemini/answer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ 
      prompt: cleanPrompt, 
      imageBase64: imagesArray.length === 1 ? imagesArray[0] : undefined,
      imagesBase64: imagesArray,
      studentContext, 
      language, 
      persona, 
      history: cleanHistory 
    }),
  });

  if (response.ok) {
    const data = await response.json();
    if (data && data.text) {
      return data.text;
    }
    throw new Error("No output generated by the AI model. Please try asking again.");
  } else {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error || errData?.message || `[HTTP ${response.status}] Failed to connect to AI serverless function on Vercel`);
  }
}


export async function generateStudyDiagram(prompt: string, type?: "svg" | "image"): Promise<string | null> {
  // 1. Try secure backend server route (Primary route)
  try {
    const response = await safeFetch("/api/gemini/diagram", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, type }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.imageUrl;
    }
  } catch (error) {
    console.warn("Backend Gemini diagram route unreachable:", error);
  }

  return null;
}

/**
 * Fisher-Yates Option Shuffler for Quiz Questions
 * Mathematically guarantees that correct answers are evenly and randomly
 * distributed across options A, B, C, and D (indices 0, 1, 2, 3), eliminating any 'C' pattern.
 */
export function shuffleQuizQuestions(questions: any[]): any[] {
  if (!Array.isArray(questions)) return [];

  return questions.map((q) => {
    const rawOptions = Array.isArray(q.options) && q.options.length === 4
      ? [...q.options]
      : ["Option A", "Option B", "Option C", "Option D"];

    const origIdx = typeof q.answer === 'number' 
      ? q.answer 
      : (typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : 0);
    const safeIdx = Math.max(0, Math.min(rawOptions.length - 1, origIdx));
    const correctText = rawOptions[safeIdx];

    // Modern Fisher-Yates random shuffle
    for (let i = rawOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rawOptions[i], rawOptions[j]] = [rawOptions[j], rawOptions[i]];
    }

    const newAnswerIdx = rawOptions.indexOf(correctText);

    return {
      question: q.question || q.questionText || "Question",
      options: rawOptions,
      answer: newAnswerIdx >= 0 ? newAnswerIdx : Math.floor(Math.random() * 4),
      explanation: q.explanation || "Correct concept derivation."
    };
  });
}

export async function generateQuiz(
  subject: string, 
  studentContext?: { name: string; school: string; className: string; country?: string; topic?: string }, 
  language: string = "English",
  difficulty: string = "Medium",
  questionCount: number = 10,
  topic?: string
): Promise<any[]> {
  const chosenTopic = (topic || studentContext?.topic || "Core Concepts").trim();
  const numQuestions = Math.max(3, Math.min(Number(questionCount) || 10, 30));

  // 1. Try secure backend server route (Primary route)
  try {
    const response = await safeFetch("/api/gemini/quiz", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        subject, 
        topic: chosenTopic,
        questionCount: numQuestions,
        studentContext, 
        language, 
        difficulty 
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return shuffleQuizQuestions(data);
      }
    }
  } catch (error) {
    console.warn("Backend Gemini quiz route unreachable:", error);
  }

  throw new Error("Unable to generate quiz questions from AI at this moment. Please try again.");
}

// Client-side flashcard cache
const clientFlashcardsCache = new Map<string, Array<{ front: string; back: string }>>();

export async function generateFlashcards(
  subject: string,
  noteTitle?: string,
  noteContent?: string,
  count: number = 5
): Promise<Array<{ front: string; back: string }>> {
  const cacheKey = `${subject}_${noteTitle || ""}_${noteContent || ""}_${count}`;

  // Read active country
  let country = "Global";
  try {
    const profileStr = localStorage.getItem('studybuddy_local_profile');
    if (profileStr) {
      const parsed = JSON.parse(profileStr);
      if (parsed && parsed.country) country = parsed.country;
    }
  } catch (e) {}

  // 1. Try country-specific durability cache
  const cachedFlashcards = getLocalCache("flashcards", country, subject, cacheKey);
  if (cachedFlashcards && Array.isArray(cachedFlashcards) && cachedFlashcards.length > 0) {
    return cachedFlashcards;
  }

  // 2. Try local memory cache
  if (clientFlashcardsCache.has(cacheKey)) {
    console.log(`[Cache Hit - Client Memory] Returning flashcards for: ${cacheKey}`);
    return clientFlashcardsCache.get(cacheKey)!;
  }

  // 3. Try localStorage cache fallback
  try {
    const localCacheStr = localStorage.getItem('studybuddy_flashcard_api_cache');
    if (localCacheStr) {
      const cacheMap = JSON.parse(localCacheStr);
      if (cacheMap[cacheKey] && Array.isArray(cacheMap[cacheKey]) && cacheMap[cacheKey].length > 0) {
        console.log(`[Cache Hit - Client LocalStorage] Returning flashcards for: ${cacheKey}`);
        clientFlashcardsCache.set(cacheKey, cacheMap[cacheKey]);
        setLocalCache("flashcards", country, subject, cacheKey, cacheMap[cacheKey]);
        return cacheMap[cacheKey];
      }
    }
  } catch (err) {
    console.warn("Could not read client flashcard localStorage cache", err);
  }

  // 4. Try secure backend server route (Primary route)
  try {
    const response = await safeFetch("/api/gemini/flashcard", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ subject, noteTitle, noteContent, count }),
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        // Cache success
        setLocalCache("flashcards", country, subject, cacheKey, data);
        clientFlashcardsCache.set(cacheKey, data);
        try {
          const localCacheStr = localStorage.getItem('studybuddy_flashcard_api_cache') || '{}';
          const cacheMap = JSON.parse(localCacheStr);
          cacheMap[cacheKey] = data;
          localStorage.setItem('studybuddy_flashcard_api_cache', JSON.stringify(cacheMap));
        } catch (cErr) {
          console.warn("Failed to store local cache", cErr);
        }
        return data;
      }
    }
  } catch (error) {
    console.warn("Backend Gemini flashcards route unreachable:", error);
  }

  throw new Error("Unable to generate flashcards from AI at this moment. Please try again.");
}

export async function generateNotes(
  topic: string,
  subject: string,
  grade: string = "10",
  language?: string
): Promise<{ title: string; content: string }> {
  try {
    const response = await safeFetch("/api/gemini/notes-generator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, subject, grade, language })
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn("Backend notes generator unreachable:", err);
  }

  return {
    title: `${topic} Notes`,
    content: `### ${topic}\n\nNotes could not be generated dynamically. Here is a brief outline of ${topic} for ${subject} at Grade ${grade} level.\n\n- Key Concept 1: Definition and details\n- Key Concept 2: Mathematical or practical applications\n- Important Formula/Fact: Standard references.`
  };
}

export async function summarizeNotes(content: string, language?: string): Promise<{ summary: string }> {
  try {
    const response = await safeFetch("/api/summarize-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, language })
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn("Backend notes summarizer unreachable:", err);
  }

  return { summary: "Failed to summarize notes dynamically due to a service error. Please try again." };
}

export async function explainTopic(
  topic: string,
  subject: string,
  grade: string = "10",
  style: string = "Simple",
  language?: string
): Promise<{ explanation: string }> {
  try {
    const response = await safeFetch("/api/gemini/explain-topic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, subject, grade, style, language })
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn("Backend explain-topic unreachable:", err);
  }

  return { explanation: "Could not fetch a simplified explanation at this moment. Please check your internet connection and try again." };
}

export async function generateMindmap(topic: string, language?: string): Promise<{ name: string; children: any[] }> {
  try {
    const response = await safeFetch("/api/gemini/mindmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, language })
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn("Backend mindmap unreachable:", err);
  }

  return {
    name: topic,
    children: [
      { name: "Overview & Definitions", children: [{ name: "Core terms" }, { name: "Basic ideas" }] },
      { name: "Key Formulas & Rules", children: [{ name: "Standard applications" }] },
      { name: "Examples", children: [] }
    ]
  };
}

export async function generateQuestionPaper(
  topic: string,
  subject: string,
  grade: string = "10",
  language?: string
): Promise<{ paperText: string }> {
  try {
    const response = await safeFetch("/api/gemini/question-paper", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, subject, grade, language })
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn("Backend question-paper unreachable:", err);
  }

  return { paperText: "Failed to generate question paper dynamically. Please try again." };
}

export async function performOcr(imageBase64: string): Promise<{ text: string }> {
  try {
    const response = await safeFetch("/api/gemini/ocr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64 })
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn("Backend OCR unreachable:", err);
  }

  return { text: "Failed to extract text from image." };
}

export async function summarizePdf(textContent: string, language?: string): Promise<{ summary: string; keyTerms: any[]; questions: any[] }> {
  try {
    const response = await safeFetch("/api/gemini/pdf-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ textContent, language })
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn("Backend PDF-summary unreachable:", err);
  }

  return {
    summary: "Could not summarize document dynamically.",
    keyTerms: [],
    questions: []
  };
}

export async function enhanceImagePrompt(prompt: string, style?: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(`${API_BASE}/api/enhance-image-prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, style }),
      signal: controller.signal
    });
    if (response.ok) {
      const data = await response.json();
      return data.enhancedPrompt || prompt;
    }
  } catch (err) {
    console.warn("Failed to enhance prompt:", err);
  } finally {
    clearTimeout(timeoutId);
  }
  return prompt;
}

export async function generateAiImage(
  prompt: string,
  size: '1K' | '2K' | '4K' | '512px' = '1K',
  aspectRatio: string = '1:1',
  options?: {
    style?: string;
    negativePrompt?: string;
    seed?: number;
  }
): Promise<{ imageUrl: string; size: string; aspectRatio: string; modelUsed?: string; width?: number; height?: number; prompt?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(`${API_BASE}/api/generate-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        size,
        aspectRatio,
        style: options?.style || 'none',
        negativePrompt: options?.negativePrompt,
        seed: options?.seed
      }),
      signal: controller.signal
    });
    if (response.ok) {
      const data = await response.json();
      incrementDailyAiUsage();
      return data;
    }
  } catch (err) {
    console.warn("API /api/generate-image call failed, fallback:", err);
  } finally {
    clearTimeout(timeoutId);
  }

  // Fallback if network fails
  const randomSeed = options?.seed || Math.floor(Math.random() * 900000) + 100000;
  const encPrompt = encodeURIComponent(prompt.slice(0, 100));
  return {
    imageUrl: `https://image.pollinations.ai/prompt/${encPrompt}?width=1024&height=1024&seed=${randomSeed}&nologo=true&enhance=true`,
    size,
    aspectRatio,
    modelUsed: 'Flux-RealAI-Engine'
  };
}


