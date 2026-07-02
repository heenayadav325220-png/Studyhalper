import { GoogleGenAI } from "@google/genai";
import { FALLBACK_QUIZZES, getFallbackAnswer } from "./fallbackData";

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
    "/api/gemini/notes-summarizer",
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

    const response = await fetch(input, modifiedInit);

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

// Lazy-loaded client-side fallback
let clientAiInstance: any = null;
function getClientAiInstance(): any {
  if (!clientAiInstance) {
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
    if (!apiKey) {
      console.warn("Client VITE_GEMINI_API_KEY is not defined.");
      return null;
    }
    clientAiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return clientAiInstance;
}

/**
 * Handles user-friendly error formatting for Gemini API failures.
 */
function handleApiError(error: any): string {
  const errMsg = error?.message || String(error);
  const status = error?.status || error?.statusCode || error?.code;

  if (errMsg.includes("API_KEY_INVALID") || errMsg.includes("invalid api key") || status === 400 && errMsg.includes("key")) {
    return "Invalid API Key: Please verify that your VITE_GEMINI_API_KEY is correct in your settings.";
  }
  if (status === 429 || errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("Rate limit")) {
    setAiQuotaExceeded(true, "Rate Limit Exceeded on Gemini client API.");
    return "Rate Limit Exceeded: We are receiving too many requests. Please wait a moment and try again.";
  }
  if (status === 503 || errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("busy") || errMsg.includes("high demand")) {
    return "Service Temporarily Unavailable: Google's AI model is currently under high demand. Retrying...";
  }
  if (errMsg.includes("timeout") || errMsg.includes("deadline")) {
    return "Connection Timeout: The request took too long. Please check your internet connection.";
  }
  if (errMsg.includes("fetch") || errMsg.includes("NetworkError") || errMsg.includes("Failed to fetch")) {
    return "Network Error: Could not connect to the API server. Please check your internet connection.";
  }
  return `AI Error: ${errMsg}`;
}

async function callClientGeminiWithRetry(
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
          throw new Error("Empty response from AI model.");
        }
        setAiQuotaExceeded(false, null); // Clear quota state on success!
        return result;
      } catch (error: any) {
        const friendlyError = handleApiError(error);
        console.warn(`[Gemini Bridge] Transitioning from ${modelCandidate} fallback...`);

        const isTransient = error.status === 503 || error.statusCode === 503 || error.code === 503 || 
                            friendlyError.includes("Temporarily Unavailable") || friendlyError.includes("Connection Timeout");
        
        if (isTransient && currentRetries > 0) {
          await new Promise((resolve) => setTimeout(resolve, currentDelay));
          currentRetries--;
          currentDelay *= 2;
        } else {
          break; // Try next model candidate or throw
        }
      }
    }
  }
  throw new Error("All client-side Gemini candidate models failed to generate content.");
}

export async function getStudyAnswer(
  prompt: string, 
  imageBase64?: string, 
  studentContext?: { name: string; school: string; className: string; country?: string }, 
  language: string = "English"
): Promise<string> {
  // 1. Try secure backend server route (Primary route)
  try {
    const response = await safeFetch("/api/gemini/answer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, imageBase64, studentContext, language }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.text) {
        return data.text;
      }
    } else {
      const errData = await response.json().catch(() => ({}));
      console.warn("Backend Gemini answer route returned error status:", response.status, errData);
    }
  } catch (error) {
    console.warn("Backend Gemini answer route unreachable, trying client-side fallback...", error);
  }

  // 2. Client-side fallback if VITE_GEMINI_API_KEY is available
  try {
    const ai = getClientAiInstance();
    if (!ai) {
      throw new Error("Client Gemini instance could not be initialized (key missing).");
    }

    const parts: any[] = [{ text: prompt }];
    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/png",
          data: imageBase64.split(',')[1] || imageBase64
        }
      });
    }

    let langInstruction = `Explain everything in English.`;
    if (language === "Hindi") {
      langInstruction = `You MUST explain entirely in clean, formal Hindi using Devanagari script. All calculations, steps, text, and encouraging words must be in Devangari Hindi.`;
    } else if (language === "Hinglish" || language === "Mixed") {
      langInstruction = `You MUST explain concepts in Hinglish (a friendly mix of simple Hindi and English, written in a warm, conversational tone using Latin characters, e.g., 'Hello! Heart humari body ka ek organ hai jo blood pump karta hai. Iske 4 parts hote hai...'). Speak like a helpful study teammate.`;
    } else if (language === "Marathi") {
      langInstruction = `You MUST explain entirely in clear, friendly Marathi language.`;
    } else if (language === "Tamil") {
      langInstruction = `You MUST explain entirely in clear, friendly Tamil language.`;
    } else if (language === "Bengali") {
      langInstruction = `You MUST explain entirely in clear, friendly Bengali language.`;
    } else if (language === "Spanish") {
      langInstruction = `You MUST explain entirely in clear, friendly Spanish language.`;
    } else if (language === "French") {
      langInstruction = `You MUST explain entirely in clear, friendly French language.`;
    } else if (language === "German") {
      langInstruction = `You MUST explain entirely in clear, friendly German language.`;
    } else if (language === "Russian") {
      langInstruction = `You MUST explain entirely in clear, friendly Russian language.`;
    } else if (language === "Chinese") {
      langInstruction = `You MUST explain entirely in clear, friendly Chinese (Simplified) language.`;
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
      ? `${appInfo} ${creatorInfo} You are an encouraging, friendly study helper/coach for a child named ${studentContext.name} who studies in ${studentContext.className} at ${studentContext.school}. ${syllabusPrompt} Keep your tone highly personalized, warm, and highly encouraging, referring to their school or name when it fits naturally. ${langInstruction}`
      : `${appInfo} ${creatorInfo} You are a helpful study assistant. Explain concepts clearly and provide step-by-step solutions. Support subjects like Math, Science, Biology, Physics, Chemistry, and English. If the user asks for a diagram or visual explanation, describe it clearly or suggest a visual aid. ${langInstruction}`;

    const response = await callClientGeminiWithRetry(ai, {
      model: "gemini-3.5-flash",
      contents: { parts },
      config: {
        systemInstruction: systemInstruction,
      },
    });
    
    return response.text;
  } catch (clientError: any) {
    console.warn("Client-side Gemini answer generation failed. Returning smart fallback answer.", clientError?.message || clientError);
    return getFallbackAnswer(prompt, studentContext);
  }
}

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
      <text x="647" y="46" font-family="system-ui, sans-serif" font-size="8.5" font-weight="extrabold" fill="#475569" text-anchor="middle">🛡�export async function generateStudyDiagram(prompt: string, type?: "svg" | "image"): Promise<string | null> {
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
    console.warn("Backend Gemini diagram route unreachable, trying client-side fallback...", error);
  }

  // 2. Client-side fallback if VITE_GEMINI_API_KEY is available
  try {
    const ai = getClientAiInstance();
    if (!ai) {
      throw new Error("Client Gemini instance could not be initialized for diagram.");
    }
    
    // If client requested image directly, try standard image model first
    if (type === "image") {
      try {
        const response = await callClientGeminiWithRetry(ai, {
          model: "gemini-3.1-flash-lite-image",
          contents: [{ text: `A highly detailed, beautiful, textbook-grade full-color graphic educational diagram or illustration showing: ${prompt}. High-contrast academic illustration, clear markings, 3D style, suitable for scientific learning.` }],
          config: {
            imageConfig: {
              aspectRatio: "1:1",
            }
          }
        });

        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              return `data:image/png;base64,${part.inlineData.data}`;
            }
          }
        }
      } catch (imgErr) {
        console.warn("Client image model generation failed:", imgErr);
      }
    }

    // Otherwise, or if image model failed, try to generate a beautiful vector SVG using the working text model gemini-3.5-flash
    try {
      const svgPrompt = `You are an expert educational designer. Create a beautiful, detailed, neat, textbook-grade academic vector SVG diagram/illustration for: "${prompt}".`or SVG diagram/illustration for: "${prompt}".
      
      Requirements:
      1. MUST be a valid, standalone <svg> element with viewBox="0 0 600 450" and width="100%" height="100%".
      2. Use a modern, ultra-clean design: soft background, precise vector shapes (rects, circles, paths), elegant colors (indigo, slate, sky, emerald), and clear, clean leader lines/arrows pointing to labels.
      3. Include prominent, highly readable, clear textbook labels for all major parts of the diagram using <text> elements (font-family="system-ui, -apple-system, sans-serif" and proper sizing/contrast).
      4. Make it highly detailed, professional, and visually appealing.
      5. Output ONLY the raw SVG code. No markdown formatting (like \`\`\`xml or \`\`\`svg), no leading/trailing commentary, no explanations. It must start with <svg and end with </svg>.`;

      const svgResponse = await callClientGeminiWithRetry(ai, {
        model: "gemini-3.5-flash",
        contents: svgPrompt,
      });

      let svgCode = svgResponse.text || "";
      // Strip markdown wrapper if present
      svgCode = svgCode.trim();
      if (svgCode.startsWith("```")) {
        svgCode = svgCode.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "").trim();
      }

      if (svgCode.includes("<svg")) {
        // Base64 encode the SVG code for safety in data URLs
        const base64Svg = btoa(unescape(encodeURIComponent(svgCode)));
        return `data:image/svg+xml;base64,${base64Svg}`;
      }
    } catch (svgErr) {
      console.warn("Client text-to-SVG fallback failed, trying client image generation...", svgErr);
    }

    // Try standard image model fallback as third resort
    try {
      const response = await callClientGeminiWithRetry(ai, {
        model: "gemini-3.1-flash-lite-image",
        contents: [{ text: `Educational diagram or illustration for: ${prompt}. Clear, academic style, labeled if necessary.` }],
        config: {
          imageConfig: {
            aspectRatio: "1:1",
          }
        }
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
    } catch (imgErr) {
      console.warn("Client image model generation failed:", imgErr);
    }

  } catch (err) {
    console.warn("Client Gemini diagram generation failed.", err);
  }

  // Guaranteed local fallback if all API calls fail (e.g. offline, 429 quota exhausted)
  try {
    const fallbackSvg = generateGuaranteedLocalSvg(prompt);
    const base64Svg = btoa(unescape(encodeURIComponent(fallbackSvg)));
    return `data:image/svg+xml;base64,${base64Svg}`;
  } catch (localErr) {
    console.error("Local fallback SVG conversion failed:", localErr);
  }

  return null;
}

export async function generateQuiz(
  subject: string, 
  studentContext?: { name: string; school: string; className: string; country?: string }, 
  language: string = "English",
  difficulty: string = "Medium"
): Promise<any[]> {
  const country = studentContext?.country || "Global";
  const quizCacheKey = `${language}_${difficulty}`;
  const cachedQuiz = getLocalCache("quiz", country, subject, quizCacheKey);
  if (cachedQuiz && Array.isArray(cachedQuiz) && cachedQuiz.length > 0) {
    return cachedQuiz;
  }

  // 1. Try secure backend server route (Primary route)
  try {
    const response = await safeFetch("/api/gemini/quiz", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ subject, studentContext, language, difficulty }),
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setLocalCache("quiz", country, subject, quizCacheKey, data);
        return data;
      }
    }
  } catch (error) {
    console.warn("Backend Gemini quiz route unreachable, trying client-side fallback...", error);
  }

  // 2. Client-side fallback if VITE_GEMINI_API_KEY is available
  try {
    const ai = getClientAiInstance();
    if (!ai) {
      throw new Error("Client Gemini instance could not be initialized for quiz.");
    }
    const classText = studentContext ? `for grade/class ${studentContext.className}` : "";
    let langPromptText = `in English`;
    if (language === "Hindi") {
      langPromptText = `entirely in Hindi language (using clear Devanagari script suitable for classroom study). All questions, descriptions, and option texts MUST be in clean Hindi.`;
    } else if (language === "Hinglish" || language === "Mixed") {
      langPromptText = `in Hinglish language (a casual mix of English and Hindi words written using standard English/Latin alphabet, e.g., 'Soil erosion ko prevent karne ka best way kya hai?'). All questions, descriptions, and option texts MUST be in clean Hinglish sentence structures.`;
    } else if (language === "Marathi") {
      langPromptText = `entirely in Marathi language. All questions, descriptions, and option texts MUST be in clean Marathi.`;
    } else if (language === "Tamil") {
      langPromptText = `entirely in Tamil language. All questions, descriptions, and option texts MUST be in clean Tamil.`;
    } else if (language === "Bengali") {
      langPromptText = `entirely in Bengali language. All questions, descriptions, and option texts MUST be in clean Bengali.`;
    } else if (language === "Spanish") {
      langPromptText = `entirely in Spanish language. All questions, descriptions, and option texts MUST be in clean Spanish.`;
    } else if (language === "French") {
      langPromptText = `entirely in French language. All questions, descriptions, and option texts MUST be in clean French.`;
    } else if (language === "German") {
      langPromptText = `entirely in German language. All questions, descriptions, and option texts MUST be in clean German.`;
    } else if (language === "Russian") {
      langPromptText = `entirely in clean, friendly Russian language. All questions, descriptions, and option texts MUST be in clean Russian.`;
    } else if (language === "Chinese") {
      langPromptText = `entirely in clean, friendly Chinese (Simplified) language. All questions, descriptions, and option texts MUST be in clean Chinese.`;
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
    if (difficulty === "Easy") {
      difficultyInstruct = "The difficulty of the quiz MUST be EASY. Focus on introductory definitions, basic principles, and simple, direct questions. Make option distractors very simple.";
    } else if (difficulty === "Hard") {
      difficultyInstruct = "The difficulty of the quiz MUST be HARD or ADVANCED. Focus on complex, multi-step problem solving, critical thinking, advanced theories, and subtle nuances. Use trickier, plausible option distractors.";
    } else {
      difficultyInstruct = "The difficulty of the quiz MUST be MEDIUM. Provide a balanced mix of conceptual recall, analytical questions, and practical applications suitable for typical classroom standards.";
    }

    const instructionText = `Generate a 5-question multiple choice quiz ${classText} ${syllabusInstruct} for ${subject} ${langPromptText}. ${difficultyInstruct} Return only valid JSON in the format: [{"question": "...", "options": ["...", "...", "...", "..."], "answer": 0}]`;

    const response = await callClientGeminiWithRetry(ai, {
      model: "gemini-3.5-flash",
      contents: instructionText,
      config: {
        responseMimeType: "application/json",
      },
    });

    try {
      const parsed = JSON.parse(response.text || "[]");
      if (Array.isArray(parsed) && parsed.length > 0) {
        setLocalCache("quiz", country, subject, quizCacheKey, parsed);
        return parsed;
      }
    } catch (e) {
      console.warn("Client quiz JSON parsing failed.", e);
    }
  } catch (clientError) {
    console.warn("Client-side Gemini quiz generation failed. Serving local fallback quiz database.", clientError);
  }

  // Final guaranteed fallback
  const langKey = (language === "Hindi" ? "Hindi" : "English") as "Hindi" | "English";
  return FALLBACK_QUIZZES[subject]?.[langKey] || FALLBACK_QUIZZES[subject]?.["English"] || [];
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
    console.warn("Backend Gemini flashcards route unreachable, trying client-side fallback...", error);
  }

  // 4. Client-side fallback if VITE_GEMINI_API_KEY is available
  try {
    const ai = getClientAiInstance();
    if (ai) {
      const contextText = noteContent 
        ? `based on the note titled "${noteTitle || 'Untitled'}" with content: "${noteContent}"`
        : `for the subject "${subject}"`;

      // Batching strategy on client side if count > 5
      let finalCards: Array<{ front: string; back: string }> = [];

      if (count > 5) {
        const prompts = [
          `Generate exactly 5 educational study flashcards ${contextText}. Focus on foundational terms and core definitions. Return ONLY valid JSON in the format: [{"front": "...", "back": "..."}]`,
          `Generate exactly ${count - 5} educational study flashcards ${contextText}. Focus on secondary concepts, formulas, and deep-dive details. Return ONLY valid JSON in the format: [{"front": "...", "back": "..."}]`
        ];

        const batchPromises = prompts.map(p => 
          callClientGeminiWithRetry(ai, {
            model: "gemini-3.5-flash",
            contents: p,
            config: { responseMimeType: "application/json" }
          })
        );

        const responses = await Promise.all(batchPromises);
        for (const res of responses) {
          try {
            const parsed = JSON.parse(res.text || "[]");
            if (Array.isArray(parsed)) {
              finalCards.push(...parsed);
            }
          } catch (e) {
            console.warn("Client batch flashcards JSON parsing failed.", e);
          }
        }
      } else {
        const instructionText = `Generate exactly ${count} educational study flashcards ${contextText}.
Identify key terms, definitions, formulas, or concepts. For each, create a brief, clear, engaging question or term for the "front" and a precise, easy-to-understand answer or explanation for the "back".
Return ONLY valid JSON in the format: [{"front": "...", "back": "..."}]`;

        const response = await callClientGeminiWithRetry(ai, {
          model: "gemini-3.5-flash",
          contents: instructionText,
          config: {
            responseMimeType: "application/json",
          },
        });

        try {
          const parsed = JSON.parse(response.text || "[]");
          if (Array.isArray(parsed) && parsed.length > 0) {
            finalCards = parsed;
          }
        } catch (e) {
          console.warn("Client flashcards JSON parsing failed.", e);
        }
      }

      if (finalCards.length > 0) {
        setLocalCache("flashcards", country, subject, cacheKey, finalCards);
        clientFlashcardsCache.set(cacheKey, finalCards);
        try {
          const localCacheStr = localStorage.getItem('studybuddy_flashcard_api_cache') || '{}';
          const cacheMap = JSON.parse(localCacheStr);
          cacheMap[cacheKey] = finalCards;
          localStorage.setItem('studybuddy_flashcard_api_cache', JSON.stringify(cacheMap));
        } catch (cErr) {
          console.warn("Failed to store local cache", cErr);
        }
        return finalCards;
      }
    }
  } catch (clientError) {
    console.warn("Client-side Gemini flashcard generation failed. Using final fallback lists.", clientError);
  }

  // Final guaranteed fallback
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

  return FALLBACK_FLASHCARDS[subject] || FALLBACK_FLASHCARDS["Science"];
}

export async function generateNotes(
  topic: string,
  subject: string,
  grade: string = "10"
): Promise<{ title: string; content: string }> {
  try {
    const response = await safeFetch("/api/gemini/notes-generator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, subject, grade })
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn("Backend notes generator failed, trying client fallback...", err);
  }

  try {
    const ai = getClientAiInstance();
    if (ai) {
      const prompt = `Generate comprehensive, highly educational, structured study notes on the topic: "${topic}" for Subject: "${subject}" at a Grade ${grade} level. 
      Format with clean Markdown, clear headings, bullet points, key definitions, and examples.
      Return ONLY valid JSON in the format: {"title": "...", "content": "..."}`;
      const response = await callClientGeminiWithRetry(ai, {
        model: "gemini-3.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "{}");
    }
  } catch (err) {
    console.error("Client-side notes generator failed:", err);
  }

  return {
    title: `${topic} Notes`,
    content: `### ${topic}\n\nNotes could not be generated dynamically. Here is a brief outline of ${topic} for ${subject} at Grade ${grade} level.\n\n- Key Concept 1: Definition and details\n- Key Concept 2: Mathematical or practical applications\n- Important Formula/Fact: Standard references.`
  };
}

export async function summarizeNotes(content: string): Promise<{ summary: string }> {
  try {
    const response = await safeFetch("/api/gemini/notes-summarizer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn("Backend notes summarizer failed, trying client fallback...", err);
  }

  try {
    const ai = getClientAiInstance();
    if (ai) {
      const prompt = `Create a concise, high-impact summary of the following study notes. Highlight key terms, major formulas, and critical takeaways using bullet points. Keep it clear and easy for a student to review quickly.\n\nNotes Content:\n${content}`;
      const response = await callClientGeminiWithRetry(ai, {
        model: "gemini-3.5-flash",
        contents: prompt,
      });
      return { summary: response.text || "Failed to generate summary." };
    }
  } catch (err) {
    console.error("Client-side notes summarizer failed:", err);
  }

  return { summary: "Failed to summarize notes dynamically due to a service error. Please try again." };
}

export async function explainTopic(
  topic: string,
  subject: string,
  grade: string = "10",
  style: string = "Simple"
): Promise<{ explanation: string }> {
  try {
    const response = await safeFetch("/api/gemini/explain-topic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, subject, grade, style })
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn("Backend explain-topic failed, trying client fallback...", err);
  }

  try {
    const ai = getClientAiInstance();
    if (ai) {
      let styleInstruction = "Explain in extremely simple, friendly language suitable for a child.";
      if (style === "Analogies") {
        styleInstruction = "Explain using vivid, funny everyday analogies and metaphors that makes it impossible to forget.";
      } else if (style === "5-year-old") {
        styleInstruction = "Explain like I am 5 years old (ELI5). Use very basic words and a fun, story-like approach.";
      } else if (style === "Step-by-step") {
        styleInstruction = "Provide a meticulous, clear step-by-step breakdown from first principles.";
      }
      const prompt = `${styleInstruction} Topic: "${topic}" (Subject: ${subject}) for Grade ${grade}. Make it engaging and encouraging!`;
      const response = await callClientGeminiWithRetry(ai, {
        model: "gemini-3.5-flash",
        contents: prompt,
      });
      return { explanation: response.text || "Failed to generate explanation." };
    }
  } catch (err) {
    console.error("Client-side explain-topic failed:", err);
  }

  return { explanation: "Could not fetch a simplified explanation at this moment. Please check your internet connection and try again." };
}

export async function generateMindmap(topic: string): Promise<{ name: string; children: any[] }> {
  try {
    const response = await safeFetch("/api/gemini/mindmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic })
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn("Backend mindmap failed, trying client fallback...", err);
  }

  try {
    const ai = getClientAiInstance();
    if (ai) {
      const prompt = `Generate a hierarchical mind map structure for the topic: "${topic}".
      Provide a deeply nested JSON representation where each node has a "name" and an optional list of "children" (which is an array of other nodes). Limit hierarchy depth to 3 levels.
      Format your response ONLY as valid JSON in this exact structure:
      {"name": "${topic}", "children": [{"name": "Subtopic A", "children": [{"name": "Detail 1"}]}, {"name": "Subtopic B", "children": []}]}`;
      const response = await callClientGeminiWithRetry(ai, {
        model: "gemini-3.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "{}");
    }
  } catch (err) {
    console.error("Client-side mindmap failed:", err);
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
  grade: string = "10"
): Promise<{ paperText: string }> {
  try {
    const response = await safeFetch("/api/gemini/question-paper", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, subject, grade })
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn("Backend question-paper failed, trying client fallback...", err);
  }

  try {
    const ai = getClientAiInstance();
    if (ai) {
      const prompt = `Create a complete, formal, school-grade question paper for the topic: "${topic}" in Subject: "${subject}" for Grade ${grade} students.
      Divide the paper into:
      - Section A: 5 Multiple Choice Questions (with correct options indicated at the very bottom in an answer key)
      - Section B: 3 Short Answer Questions (each with marks allotted, e.g., [3 Marks])
      - Section C: 2 Long Answer/Analytical Questions (each with marks allotted, e.g., [5 Marks])
      Format beautifully with clean Markdown headings and lines.`;
      const response = await callClientGeminiWithRetry(ai, {
        model: "gemini-3.5-flash",
        contents: prompt,
      });
      return { paperText: response.text || "Failed to generate question paper." };
    }
  } catch (err) {
    console.error("Client-side question-paper failed:", err);
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
    console.warn("Backend OCR failed, trying client fallback...", err);
  }

  try {
    const ai = getClientAiInstance();
    if (ai) {
      const cleanBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
      const response = await callClientGeminiWithRetry(ai, {
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
      return { text: response.text || "Failed to extract text." };
    }
  } catch (err) {
    console.error("Client-side OCR failed:", err);
  }

  return { text: "Failed to extract text from image." };
}

export async function summarizePdf(textContent: string): Promise<{ summary: string; keyTerms: any[]; questions: any[] }> {
  try {
    const response = await safeFetch("/api/gemini/pdf-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ textContent })
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn("Backend PDF-summary failed, trying client fallback...", err);
  }

  try {
    const ai = getClientAiInstance();
    if (ai) {
      const prompt = `Analyze the following document text and produce a structured analysis.
      Return a JSON object containing:
      1. "summary": A concise overview of the document (Markdown-enabled string).
      2. "keyTerms": An array of objects: [{"term": "...", "definition": "..."}].
      3. "questions": An array of mock test questions: [{"question": "...", "options": ["...", "...", "...", "..."], "answer": 0}].
      Limit key terms to 5 and questions to 5.
      
      Document text:
      ${textContent.substring(0, 8000)}`;
      const response = await callClientGeminiWithRetry(ai, {
        model: "gemini-3.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "{}");
    }
  } catch (err) {
    console.error("Client-side PDF-summary failed:", err);
  }

  return {
    summary: "Could not summarize document dynamically.",
    keyTerms: [],
    questions: []
  };
}


