import fetch from "node-fetch";

// 1. Interfaces & Types as specified in the Master Production Directive
export interface AIRequestContext {
  modality: "text" | "image" | "document" | "multimodal";
  requiresVision: boolean;
  requiresLongContext?: boolean;
  preferredProvider?: "groq" | "gemini" | "openrouter";
  modelPreference?: string;
  systemInstruction?: string;
}

export interface NormalizedAIResponse {
  success: boolean;
  text?: string;
  provider?: string;
  model?: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface ProviderCredential {
  id: string; // e.g. "groq-1", "gemini-2"
  provider: "groq" | "gemini" | "openrouter";
  secret: string;
  enabled: boolean;
}

export interface ProviderHealth {
  consecutiveFailures: number;
  cooldownUntil: number;
  lastFailureAt?: number;
  lastSuccessAt?: number;
  lastStatusCode?: number;
  totalRequests: number;
  successfulRequests: number;
}

// 2. Centralized Model Configurations
export const MODEL_CONFIG = {
  groq: {
    text: "llama-3.3-70b-versatile",
    textAlternative: "qwen-2.5-coder-32b",
    vision: "llama-3.2-11b-vision-preview"
  },
  gemini: {
    text: "gemini-2.5-flash",
    textAlternative: "gemini-1.5-flash",
    vision: "gemini-2.5-flash"
  },
  openrouter: {
    text: "google/gemini-2.5-flash",
    textAlternative: "google/gemini-2.5-flash",
    vision: "google/gemini-2.5-flash"
  }
};

// 3. Configuration values from environment with solid defaults
const COOLDOWN_MS = Number(process.env.AI_PROVIDER_COOLDOWN_MS) || 60000; // 60 seconds
const REQUEST_TIMEOUT_MS = Number(process.env.AI_REQUEST_TIMEOUT_MS) || 30000; // 30 seconds
const MAX_RETRIES = Number(process.env.AI_MAX_RETRIES) || 2;
const MAX_BACKOFF_MS = Number(process.env.AI_MAX_BACKOFF_MS) || 3000;

// 4. In-Memory Gateway State
const credentials: ProviderCredential[] = [];
const healthTracker = new Map<string, ProviderHealth>();

let groqCursor = 0;
let geminiCursor = 0;
let openrouterCursor = 0;

// 5. Initialize credentials once
export function initializeGateway() {
  credentials.length = 0;
  healthTracker.clear();

  // A. Parse Gemini Keys
  const geminiKeys: string[] = [];
  
  // 1. Support legacy unnumbered keys first
  const legacyGemini = (process.env.GEMINI_API_KEY || 
                        process.env.VITE_GEMINI_API_KEY || 
                        process.env.GOOGLE_API_KEY || 
                        process.env.API_KEY || "").trim();
  if (legacyGemini) {
    geminiKeys.push(legacyGemini);
  }

  // 2. Support comma-separated format if provided
  const geminiRaw = process.env.GEMINI_API_KEYS || "";
  geminiRaw.split(",").map(k => k.trim()).filter(k => k.length > 0).forEach(k => {
    if (!geminiKeys.includes(k)) geminiKeys.push(k);
  });

  // 3. Support separate numbered keys (GEMINI_API_KEY_1, GEMINI_API_KEY_2, GEMINI_API_KEY_3...)
  let geminiIndex = 1;
  while (true) {
    const numberedKey = (process.env[`GEMINI_API_KEY_${geminiIndex}`] || "").trim();
    if (!numberedKey) break;
    if (!geminiKeys.includes(numberedKey)) {
      geminiKeys.push(numberedKey);
    }
    geminiIndex++;
  }

  geminiKeys.forEach((key, index) => {
    const id = `gemini-${index + 1}`;
    credentials.push({
      id,
      provider: "gemini",
      secret: key,
      enabled: true
    });
    initHealth(id);
  });

  // B. Parse Groq Keys
  const groqKeys: string[] = [];
  
  // 1. Support legacy unnumbered key
  const legacyGroq = (process.env.GROQ_API_KEY || "").trim();
  if (legacyGroq) {
    groqKeys.push(legacyGroq);
  }

  // 2. Support comma-separated format if provided
  const groqRaw = process.env.GROQ_API_KEYS || "";
  groqRaw.split(",").map(k => k.trim()).filter(k => k.length > 0).forEach(k => {
    if (!groqKeys.includes(k)) groqKeys.push(k);
  });

  // 3. Support separate numbered keys (GROQ_API_KEY_1, GROQ_API_KEY_2, GROQ_API_KEY_3...)
  let groqIndex = 1;
  while (true) {
    const numberedKey = (process.env[`GROQ_API_KEY_${groqIndex}`] || "").trim();
    if (!numberedKey) break;
    if (!groqKeys.includes(numberedKey)) {
      groqKeys.push(numberedKey);
    }
    groqIndex++;
  }

  groqKeys.forEach((key, index) => {
    const id = `groq-${index + 1}`;
    credentials.push({
      id,
      provider: "groq",
      secret: key,
      enabled: true
    });
    initHealth(id);
  });

  // C. Parse OpenRouter Keys
  const orKeys: string[] = [];
  
  // 1. Support legacy unnumbered key
  const legacyOr = (process.env.OPENROUTER_API_KEY || "").trim();
  if (legacyOr) {
    orKeys.push(legacyOr);
  }

  // 2. Support comma-separated format
  const orRaw = process.env.OPENROUTER_API_KEYS || "";
  orRaw.split(",").map(k => k.trim()).filter(k => k.length > 0).forEach(k => {
    if (!orKeys.includes(k)) orKeys.push(k);
  });

  // 3. Support separate numbered keys (OPENROUTER_API_KEY_1, OPENROUTER_API_KEY_2...)
  let orIndex = 1;
  while (true) {
    const numberedKey = (process.env[`OPENROUTER_API_KEY_${orIndex}`] || "").trim();
    if (!numberedKey) break;
    if (!orKeys.includes(numberedKey)) {
      orKeys.push(numberedKey);
    }
    orIndex++;
  }

  orKeys.forEach((key, index) => {
    const id = `openrouter-${index + 1}`;
    credentials.push({
      id,
      provider: "openrouter",
      secret: key,
      enabled: true
    });
    initHealth(id);
  });

  console.log(`[AI_GATEWAY] Initialized with ${credentials.length} credentials.`);
  for (const cred of credentials) {
    console.log(`[AI_GATEWAY] Registered credential ID: ${cred.id} (${cred.provider})`);
  }
}

function initHealth(id: string) {
  healthTracker.set(id, {
    consecutiveFailures: 0,
    cooldownUntil: 0,
    totalRequests: 0,
    successfulRequests: 0
  });
}

// 6. Public Health Inspection Endpoint helper
export function getProviderHealth() {
  const summary: Record<string, { healthy: number; cooldown: number; total: number }> = {
    groq: { healthy: 0, cooldown: 0, total: 0 },
    gemini: { healthy: 0, cooldown: 0, total: 0 },
    openrouter: { healthy: 0, cooldown: 0, total: 0 }
  };

  const now = Date.now();
  for (const cred of credentials) {
    const health = healthTracker.get(cred.id);
    if (!health) continue;

    summary[cred.provider].total++;
    if (now < health.cooldownUntil) {
      summary[cred.provider].cooldown++;
    } else if (cred.enabled) {
      summary[cred.provider].healthy++;
    }
  }

  return summary;
}

// 7. Modality / Key Selection Router with Round-Robin Load Distribution
export function selectProvider(context: AIRequestContext): ProviderCredential | null {
  const now = Date.now();

  // Filter out disabled & cooldown credentials
  let eligible = credentials.filter(cred => {
    if (!cred.enabled) return false;
    const health = healthTracker.get(cred.id);
    if (!health) return false;
    if (now < health.cooldownUntil) return false;
    return true;
  });

  if (eligible.length === 0) {
    return null;
  }

  // Vision Modality Enforcement
  if (context.requiresVision) {
    eligible = eligible.filter(cred => {
      // Gemini always supports vision. Groq only if vision model is used. OpenRouter supports vision.
      return cred.provider === "gemini" || cred.provider === "openrouter" || cred.provider === "groq";
    });
  }

  if (eligible.length === 0) {
    return null;
  }

  // Context preferred provider check
  if (context.preferredProvider) {
    const preferred = eligible.filter(c => c.provider === context.preferredProvider);
    if (preferred.length > 0) {
      eligible = preferred;
    }
  }

  // Round-Robin Cursor Strategy
  // Separate cursor per provider type to ensure balanced distribution
  let selected: ProviderCredential;
  if (eligible.some(c => c.provider === "groq")) {
    const groqEligible = eligible.filter(c => c.provider === "groq");
    if (groqEligible.length > 0) {
      const idx = groqCursor % groqEligible.length;
      selected = groqEligible[idx];
      groqCursor = (groqCursor + 1) % 100000;
      return selected;
    }
  }

  if (eligible.some(c => c.provider === "openrouter")) {
    const orEligible = eligible.filter(c => c.provider === "openrouter");
    if (orEligible.length > 0) {
      const idx = openrouterCursor % orEligible.length;
      selected = orEligible[idx];
      openrouterCursor = (openrouterCursor + 1) % 100000;
      return selected;
    }
  }

  // Fallback to whichever eligible is next
  const idx = geminiCursor % eligible.length;
  selected = eligible[idx];
  geminiCursor = (geminiCursor + 1) % 100000;
  return selected;
}

// 8. Cooldown / Failure Circuit Breaker Mechanics
export function markProviderFailure(id: string, statusCode?: number) {
  const health = healthTracker.get(id);
  if (!health) return;

  health.consecutiveFailures++;
  health.lastFailureAt = Date.now();
  if (statusCode) health.lastStatusCode = statusCode;
  
  // Backoff cooldown period: 60s base multiplied by consecutive failure factor
  const factor = Math.min(health.consecutiveFailures, 5);
  health.cooldownUntil = Date.now() + (COOLDOWN_MS * factor);

  console.warn(`[AI_GATEWAY] [FAILURE] credentialId=${id} consecutiveFailures=${health.consecutiveFailures} cooldownMs=${COOLDOWN_MS * factor} statusCode=${statusCode || "unknown"}`);
}

export function markProviderSuccess(id: string) {
  const health = healthTracker.get(id);
  if (!health) return;

  health.consecutiveFailures = 0;
  health.lastSuccessAt = Date.now();
  health.cooldownUntil = 0;
  health.successfulRequests++;
  
  console.log(`[AI_GATEWAY] [SUCCESS] credentialId=${id} totalRequests=${health.totalRequests} successfulRequests=${health.successfulRequests}`);
}

// 9. Error Classifier
export function classifyProviderError(status: number, message: string): "TRANSIENT" | "AUTHENTICATION" | "INVALID_REQUEST" {
  if (status === 401 || status === 403 || message.includes("API key") || message.includes("invalid key") || message.includes("unauthorized")) {
    return "AUTHENTICATION";
  }
  if (status === 400 || status === 422 || message.includes("invalid model") || message.includes("unsupported modality")) {
    return "INVALID_REQUEST";
  }
  // 429 (rate-limit), 500, 502, 503, 504 are transient
  return "TRANSIENT";
}

// 10. OpenAI-style message formatter from Gemini contents array
function mapGeminiContentsToOpenAi(contents: any[], systemInstruction?: string) {
  const messages: any[] = [];
  if (systemInstruction) {
    messages.push({ role: "system", content: systemInstruction });
  }

  for (const item of contents) {
    const role = item.role === 'model' ? 'assistant' : 'user';
    
    // Check if parts is simple text, array, or contains visual elements
    if (Array.isArray(item.parts)) {
      const contentParts: any[] = [];
      let simpleText = "";

      for (const part of item.parts) {
        if (part.text) {
          simpleText += part.text + "\n";
          contentParts.push({ type: "text", text: part.text });
        } else if (part.inlineData) {
          const mime = part.inlineData.mimeType || "image/png";
          const base64 = part.inlineData.data;
          contentParts.push({
            type: "image_url",
            image_url: {
              url: `data:${mime};base64,${base64}`
            }
          });
        }
      }

      if (contentParts.length > 1) {
        messages.push({ role, content: contentParts });
      } else {
        simpleText = simpleText.trim();
        if (simpleText) {
          messages.push({ role, content: simpleText });
        }
      }
    } else if (typeof item.parts === 'string') {
      const text = item.parts.trim();
      if (text) {
        messages.push({ role, content: text });
      }
    }
  }

  return messages;
}

// 11. Execute Single Network Request with Built-in Timeout Protection
async function executeProviderRequest(
  cred: ProviderCredential,
  context: AIRequestContext,
  payload: any,
  requestId: string
): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const start = Date.now();
  let response: any;
  let status = 0;
  
  try {
    const health = healthTracker.get(cred.id);
    if (health) health.totalRequests++;

    if (cred.provider === "gemini") {
      // Format Gemini API contents
      let geminiPayload: any = {};
      
      if (typeof payload === 'string') {
        geminiPayload = {
          contents: [{ parts: [{ text: payload }] }]
        };
      } else if (payload.contents) {
        geminiPayload = { contents: payload.contents };
      } else {
        geminiPayload = { contents: [{ parts: [{ text: JSON.stringify(payload) }] }] };
      }

      if (context.systemInstruction) {
        geminiPayload.systemInstruction = {
          parts: [{ text: context.systemInstruction }]
        };
      }

      if (payload.config) {
        geminiPayload.generationConfig = payload.config;
      }

      const model = context.modelPreference || (context.requiresVision ? MODEL_CONFIG.gemini.vision : MODEL_CONFIG.gemini.text);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cred.secret}`;

      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiPayload),
        signal: controller.signal
      });

      status = response.status;
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        throw { status, message: errText || "Gemini request failed" };
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const inputTokens = data?.usageMetadata?.promptTokenCount || 0;
      const outputTokens = data?.usageMetadata?.candidatesTokenCount || 0;

      return {
        text,
        model,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens
        }
      };

    } else {
      // Groq & OpenRouter compatible APIs
      let endpoint = "https://api.groq.com/openai/v1/chat/completions";
      let model = MODEL_CONFIG.groq.text;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${cred.secret}`
      };

      if (cred.provider === "groq") {
        if (context.requiresVision) {
          model = MODEL_CONFIG.groq.vision;
        } else {
          model = context.modelPreference || MODEL_CONFIG.groq.text;
        }
      } else if (cred.provider === "openrouter") {
        endpoint = "https://openrouter.ai/api/v1/chat/completions";
        headers["HTTP-Referer"] = "https://studyhalper.vercel.app";
        headers["X-Title"] = "Ascend Study";
        model = MODEL_CONFIG.openrouter.text;
      }

      let messages: any[] = [];
      if (typeof payload === 'string') {
        messages = [{ role: "user", content: payload }];
        if (context.systemInstruction) {
          messages.unshift({ role: "system", content: context.systemInstruction });
        }
      } else if (payload.contents) {
        messages = mapGeminiContentsToOpenAi(payload.contents, context.systemInstruction);
      } else {
        messages = [{ role: "user", content: JSON.stringify(payload) }];
      }

      response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          messages,
          temperature: payload.config?.temperature || 0.3,
          response_format: payload.config?.responseMimeType === 'application/json' ? { type: "json_object" } : undefined
        }),
        signal: controller.signal
      });

      status = response.status;
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        throw { status, message: errText || "Provider request failed" };
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content || "";
      const inputTokens = data?.usage?.prompt_tokens || 0;
      const outputTokens = data?.usage?.completion_tokens || 0;

      return {
        text,
        model,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens
        }
      };
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - start;
    const finalStatus = err.status || status || 500;
    const errorMsg = err.message || String(err);
    
    console.error(`[AI_GATEWAY] [REQUEST_ERROR] requestId=${requestId} provider=${cred.provider} credential=${cred.id} latencyMs=${latencyMs} status=${finalStatus} error="${errorMsg.slice(0, 100)}"`);
    throw { status: finalStatus, message: errorMsg };
  }
}

// 12. Central Unified Entrypoint with Modality-Aware Fallbacks & Exponential Backoff
export async function executeAIRequest(
  context: AIRequestContext,
  payload: any
): Promise<NormalizedAIResponse> {
  const requestId = `req_${Math.random().toString(36).substring(2, 11)}`;
  let attempts = 0;
  const triedCredentials = new Set<string>();

  console.log(`[AI_GATEWAY] [NEW_REQUEST] requestId=${requestId} modality=${context.modality} requiresVision=${context.requiresVision}`);

  while (attempts <= MAX_RETRIES) {
    const cred = selectProvider(context);
    if (!cred) {
      console.error(`[AI_GATEWAY] [NO_HEALTHY_PROVIDERS] requestId=${requestId} attempts=${attempts}`);
      break;
    }

    if (triedCredentials.has(cred.id)) {
      // Avoid querying the same failed credential again in this loop
      attempts++;
      continue;
    }

    triedCredentials.add(cred.id);
    const start = Date.now();

    try {
      const result = await executeProviderRequest(cred, context, payload, requestId);
      const latencyMs = Date.now() - start;

      // Log success cleanly
      console.log(`[AI_GATEWAY] [SUCCESS] requestId=${requestId} provider=${cred.provider} credential=${cred.id} model=${result.model} status=success latencyMs=${latencyMs}`);
      
      markProviderSuccess(cred.id);

      return {
        success: true,
        text: result.text,
        provider: cred.provider,
        model: result.model,
        usage: result.usage
      };

    } catch (err: any) {
      attempts++;
      const latencyMs = Date.now() - start;
      const status = err.status || 500;
      const message = err.message || "Unknown error";

      console.warn(`[AI_GATEWAY] [ATTEMPT_FAILED] requestId=${requestId} provider=${cred.provider} credential=${cred.id} latencyMs=${latencyMs} status=${status} message="${message.slice(0, 100)}"`);

      markProviderFailure(cred.id, status);

      const errClass = classifyProviderError(status, message);
      if (errClass === "AUTHENTICATION" || errClass === "INVALID_REQUEST") {
        // Circuit break immediately on Authentication or bad payloads - do not retry blindly
        console.error(`[AI_GATEWAY] [NON_RETRYABLE_ERROR] requestId=${requestId} class=${errClass} credential=${cred.id}`);
        return {
          success: false,
          error: {
            code: `AI_${errClass}_ERROR`,
            message: `Request failed due to ${errClass.toLowerCase()} issues.`
          }
        };
      }

      // If we have remaining attempts, apply bounded exponential backoff
      if (attempts <= MAX_RETRIES) {
        const delay = Math.min(Math.pow(2, attempts) * 100, MAX_BACKOFF_MS);
        console.log(`[AI_GATEWAY] [FAILOVER_RETRY] requestId=${requestId} delayMs=${delay} nextAttempt=${attempts + 1}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  return {
    success: false,
    error: {
      code: "AI_TEMPORARILY_UNAVAILABLE",
      message: "AI service is temporarily busy. Please try again shortly."
    }
  };
}
