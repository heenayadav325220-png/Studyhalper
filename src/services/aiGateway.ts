import fetch from "node-fetch";

// 1. Interfaces & Types
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
  id: string; // e.g. "gemini-1", "groq-2"
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

// 3. Configuration values
const COOLDOWN_MS = Number(process.env.AI_PROVIDER_COOLDOWN_MS) || 12000; // 12 seconds cooldown for quick quota recovery
const REQUEST_TIMEOUT_MS = Number(process.env.AI_REQUEST_TIMEOUT_MS) || 90000; // 90 seconds for robust Advanced Toolkit execution

// 4. In-Memory Gateway State
const credentials: ProviderCredential[] = [];
const healthTracker = new Map<string, ProviderHealth>();

let roundRobinCursor = 0;

// 5. Initialize and load credentials dynamically
export function initializeGateway() {
  credentials.length = 0;
  healthTracker.clear();

  // A. Parse Gemini Keys
  const geminiKeys: string[] = [];
  
  // 1. Unnumbered legacy keys
  const legacyGemini = (process.env.GEMINI_API_KEY || 
                        process.env.VITE_GEMINI_API_KEY || 
                        process.env.GOOGLE_API_KEY || 
                        process.env.API_KEY || "").trim();
  if (legacyGemini && !geminiKeys.includes(legacyGemini)) {
    geminiKeys.push(legacyGemini);
  }

  // 2. Numbered keys (GEMINI_API_KEY_1, GEMINI_API_KEY_2, GEMINI_API_KEY_3...)
  for (let i = 1; i <= 30; i++) {
    const key = (process.env[`GEMINI_API_KEY_${i}`] || "").trim();
    if (key && !geminiKeys.includes(key)) {
      geminiKeys.push(key);
    }
  }

  // 3. Comma-separated format if provided
  const geminiRaw = process.env.GEMINI_API_KEYS || "";
  geminiRaw.split(",").map(k => k.trim()).filter(k => k.length > 0).forEach(k => {
    if (!geminiKeys.includes(k)) geminiKeys.push(k);
  });

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
  
  // 1. Unnumbered key
  const legacyGroq = (process.env.GROQ_API_KEY || "").trim();
  if (legacyGroq && !groqKeys.includes(legacyGroq)) {
    groqKeys.push(legacyGroq);
  }

  // 2. Numbered keys (GROQ_API_KEY_1, GROQ_API_KEY_2, GROQ_API_KEY_3...)
  for (let i = 1; i <= 30; i++) {
    const key = (process.env[`GROQ_API_KEY_${i}`] || "").trim();
    if (key && !groqKeys.includes(key)) {
      groqKeys.push(key);
    }
  }

  // 3. Comma-separated format
  const groqRaw = process.env.GROQ_API_KEYS || "";
  groqRaw.split(",").map(k => k.trim()).filter(k => k.length > 0).forEach(k => {
    if (!groqKeys.includes(k)) groqKeys.push(k);
  });

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
  const legacyOr = (process.env.OPENROUTER_API_KEY || "").trim();
  if (legacyOr && !orKeys.includes(legacyOr)) {
    orKeys.push(legacyOr);
  }

  for (let i = 1; i <= 30; i++) {
    const key = (process.env[`OPENROUTER_API_KEY_${i}`] || "").trim();
    if (key && !orKeys.includes(key)) {
      orKeys.push(key);
    }
  }

  const orRaw = process.env.OPENROUTER_API_KEYS || "";
  orRaw.split(",").map(k => k.trim()).filter(k => k.length > 0).forEach(k => {
    if (!orKeys.includes(k)) orKeys.push(k);
  });

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

  console.log(`[AI_GATEWAY] Loaded ${credentials.length} configured credentials into active pool.`);
  for (const cred of credentials) {
    console.log(`[AI_GATEWAY] -> Registered ID: ${cred.id} (${cred.provider})`);
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

// 6. Public Health Inspection
export function getProviderHealth() {
  const summary: Record<string, { healthy: number; cooldown: number; disabled: number; total: number }> = {
    groq: { healthy: 0, cooldown: 0, disabled: 0, total: 0 },
    gemini: { healthy: 0, cooldown: 0, disabled: 0, total: 0 },
    openrouter: { healthy: 0, cooldown: 0, disabled: 0, total: 0 }
  };

  const now = Date.now();
  for (const cred of credentials) {
    const health = healthTracker.get(cred.id);
    if (!health) continue;

    summary[cred.provider].total++;
    if (!cred.enabled) {
      summary[cred.provider].disabled++;
    } else if (now < health.cooldownUntil) {
      summary[cred.provider].cooldown++;
    } else {
      summary[cred.provider].healthy++;
    }
  }

  return summary;
}

// 7. Modality-Aware Provider Selection with Fair Round-Robin and Cooldown Respect
export function selectProvider(context: AIRequestContext, excludeIds: Set<string>): ProviderCredential | null {
  const now = Date.now();

  // Filter: Must be enabled and not yet tried in this request
  let pool = credentials.filter(cred => {
    if (!cred.enabled) return false;
    if (excludeIds.has(cred.id)) return false;
    return true;
  });

  if (pool.length === 0) {
    return null;
  }

  // Vision Modality Enforcement: Text-only models must NEVER receive image payloads
  if (context.requiresVision) {
    pool = pool.filter(cred => cred.provider === "gemini" || cred.provider === "openrouter");
  }

  if (pool.length === 0) {
    return null;
  }

  // Support preferredProvider prioritization
  if (context.preferredProvider) {
    const preferredPool = pool.filter(cred => cred.provider === context.preferredProvider);
    if (preferredPool.length > 0) {
      const readyPreferred = preferredPool.filter(cred => {
        const health = healthTracker.get(cred.id);
        return !health || now >= health.cooldownUntil;
      });
      const candidates = readyPreferred.length > 0 ? readyPreferred : preferredPool;
      const selected = candidates[roundRobinCursor % candidates.length];
      roundRobinCursor = (roundRobinCursor + 1) % 100000;
      return selected;
    }
  }

  // Prioritize credentials currently out of cooldown
  const readyCredentials = pool.filter(cred => {
    const health = healthTracker.get(cred.id);
    return !health || now >= health.cooldownUntil;
  });

  const candidates = readyCredentials.length > 0 ? readyCredentials : pool;

  // Round-robin selection
  const selected = candidates[roundRobinCursor % candidates.length];
  roundRobinCursor = (roundRobinCursor + 1) % 100000;
  return selected;
}

// 8. Health tracking updates
export function markProviderFailure(id: string, statusCode?: number) {
  const health = healthTracker.get(id);
  if (!health) return;

  health.consecutiveFailures++;
  health.lastFailureAt = Date.now();
  if (statusCode) health.lastStatusCode = statusCode;

  // Rate limit 429 = 60s cooldown; other errors = 15s cooldown
  const cooldownDuration = statusCode === 429 ? COOLDOWN_MS : 15000;
  health.cooldownUntil = Date.now() + cooldownDuration;

  console.warn(`[AI_GATEWAY] [FAILURE] ID=${id} failures=${health.consecutiveFailures} cooldownMs=${cooldownDuration} status=${statusCode || "unknown"}`);
}

export function markProviderSuccess(id: string) {
  const health = healthTracker.get(id);
  if (!health) return;

  health.consecutiveFailures = 0;
  health.lastSuccessAt = Date.now();
  health.cooldownUntil = 0;
  health.successfulRequests++;
}

// 9. Format Gemini contents to OpenAI messages for Groq & OpenRouter
function mapGeminiContentsToOpenAi(contents: any[], systemInstruction?: string) {
  const messages: any[] = [];
  if (systemInstruction) {
    messages.push({ role: "system", content: systemInstruction });
  }

  for (const item of contents) {
    const role = item.role === 'model' ? 'assistant' : 'user';

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

// 10. Execute Single Provider Request with AbortController timeout
async function executeProviderRequest(
  cred: ProviderCredential,
  context: AIRequestContext,
  payload: any,
  requestId: string
): Promise<{ text: string; model: string; usage?: any }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const start = Date.now();

  try {
    const health = healthTracker.get(cred.id);
    if (health) health.totalRequests++;

    if (cred.provider === "gemini") {
      let geminiPayload: any = {};

      if (typeof payload === 'string') {
        geminiPayload = {
          contents: [{ parts: [{ text: payload }] }]
        };
      } else if (payload.contents) {
        if (typeof payload.contents === 'string') {
          geminiPayload = { contents: [{ parts: [{ text: payload.contents }] }] };
        } else {
          geminiPayload = { contents: payload.contents };
        }
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

      const primaryModel = context.modelPreference || (context.requiresVision ? MODEL_CONFIG.gemini.vision : MODEL_CONFIG.gemini.text);
      const modelsToTry = [
        primaryModel, 
        "gemini-2.5-flash-lite", 
        "gemini-3.5-flash-lite", 
        "gemini-3.1-flash-lite", 
        "gemma-4-26b-a4b-it"
      ];

      let lastGeminiErr: any = null;
      for (const model of modelsToTry) {
        // Calculate remaining time relative to the overall global timeout (25 seconds total)
        const elapsed = Date.now() - start;
        const remainingTime = Math.max(2000, REQUEST_TIMEOUT_MS - elapsed);
        const modelTimeout = Math.min(8000, remainingTime); // Fast timeout up to 8s per model trial

        const modelController = new AbortController();
        const modelTimeoutId = setTimeout(() => modelController.abort(), modelTimeout);

        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cred.secret}`;

          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(geminiPayload),
            signal: modelController.signal
          });

          clearTimeout(modelTimeoutId);

          if (!response.ok) {
            const errText = await response.text();
            lastGeminiErr = { status: response.status, message: errText || `Gemini API HTTP ${response.status}` };
            if (response.status === 429 || response.status === 503) {
              console.warn(`[AI_GATEWAY] Model ${model} on ${cred.id} hit ${response.status}. Trying next model on this key...`);
              continue;
            }
            throw lastGeminiErr;
          }

          clearTimeout(timeoutId);
          const data = await response.json();
          const parts = data?.candidates?.[0]?.content?.parts || [];
          const text = parts.map((p: any) => p.text || "").join("").trim();

          if (!text) {
            const finishReason = data?.candidates?.[0]?.finishReason;
            if (finishReason && finishReason !== "STOP") {
              throw { status: 400, message: `Gemini content blocked: ${finishReason}` };
            }
            continue;
          }

          const inputTokens = data?.usageMetadata?.promptTokenCount || 0;
          const outputTokens = data?.usageMetadata?.candidatesTokenCount || 0;

          return {
            text,
            model,
            usage: { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens }
          };
        } catch (fetchErr: any) {
          clearTimeout(modelTimeoutId);
          if (fetchErr.name === 'AbortError') {
            console.warn(`[AI_GATEWAY] Model ${model} timed out after ${modelTimeout}ms. Trying next model...`);
            lastGeminiErr = { status: 504, message: `Model ${model} timed out after ${modelTimeout}ms` };
            continue;
          }
          if (fetchErr.status) throw fetchErr;
          lastGeminiErr = { status: 500, message: fetchErr.message || String(fetchErr) };
          continue;
        }
      }

      clearTimeout(timeoutId);
      throw lastGeminiErr || { status: 500, message: "All Gemini models on this credential failed." };

    } else {
      // Groq & OpenRouter OpenAI-compatible requests
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
        const contentsArray = typeof payload.contents === 'string'
          ? [{ role: 'user', parts: [{ text: payload.contents }] }]
          : payload.contents;
        messages = mapGeminiContentsToOpenAi(contentsArray, context.systemInstruction);
      } else {
        messages = [{ role: "user", content: JSON.stringify(payload) }];
      }

      const response = await fetch(endpoint, {
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

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        throw { status: response.status, message: errText || `Provider ${cred.provider} HTTP ${response.status}` };
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content || "";
      if (!text.trim()) {
        throw { status: 500, message: `Empty completion returned from ${cred.provider}` };
      }

      const inputTokens = data?.usage?.prompt_tokens || 0;
      const outputTokens = data?.usage?.completion_tokens || 0;

      return {
        text,
        model,
        usage: { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens }
      };
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - start;
    const finalStatus = err.status || (err.name === 'AbortError' ? 504 : 500);
    const errorMsg = err.message || (err.name === 'AbortError' ? 'Request timed out' : String(err));

    console.error(`[AI_GATEWAY] [CALL_FAILED] requestId=${requestId} id=${cred.id} provider=${cred.provider} latency=${latencyMs}ms status=${finalStatus} error="${errorMsg.slice(0, 100)}"`);
    throw { status: finalStatus, message: errorMsg };
  }
}

// 11. Central Gateway Entrypoint: Switches across ALL configured keys on failure in 0.1s
export async function executeAIRequest(
  context: AIRequestContext,
  payload: any
): Promise<NormalizedAIResponse> {
  // Ensure credentials pool is populated
  if (credentials.length === 0) {
    initializeGateway();
  }

  if (credentials.length === 0) {
    return {
      success: false,
      error: {
        code: "NO_API_KEYS_CONFIGURED",
        message: "No AI API keys are configured on the server. Please add your Gemini or Groq API keys."
      }
    };
  }

  const requestId = `req_${Math.random().toString(36).substring(2, 9)}`;
  const triedCredentials = new Set<string>();
  const maxAttempts = Math.max(credentials.length, 5);
  let lastError: any = null;

  console.log(`[AI_GATEWAY] [START] requestId=${requestId} modality=${context.modality} poolSize=${credentials.length}`);

  while (triedCredentials.size < maxAttempts) {
    const cred = selectProvider(context, triedCredentials);
    if (!cred) {
      console.warn(`[AI_GATEWAY] [NO_MORE_CANDIDATES] requestId=${requestId} tried=${triedCredentials.size}/${credentials.length}`);
      break;
    }

    triedCredentials.add(cred.id);
    const start = Date.now();

    try {
      const result = await executeProviderRequest(cred, context, payload, requestId);
      const latencyMs = Date.now() - start;

      console.log(`[AI_GATEWAY] [SUCCESS] requestId=${requestId} id=${cred.id} provider=${cred.provider} model=${result.model} latency=${latencyMs}ms`);
      markProviderSuccess(cred.id);

      return {
        success: true,
        text: result.text,
        provider: cred.provider,
        model: result.model,
        usage: result.usage
      };

    } catch (err: any) {
      lastError = err;
      const status = err.status || 500;
      const errMsg = err.message || String(err);

      // Handle invalid credentials
      if (status === 401 || status === 403 || errMsg.includes("API key not valid") || errMsg.includes("API_KEY_INVALID")) {
        cred.enabled = false;
        console.error(`[AI_GATEWAY] Key disabled due to invalid credentials: ${cred.id}`);
      } else {
        markProviderFailure(cred.id, status);
      }

      console.log(`[AI_GATEWAY] [ROTATING_KEY] requestId=${requestId} -> Failing over to next available key in 0.1s...`);
      // 100ms pause to yield event loop cleanly
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // All keys were exhausted; return a clean, honest error message
  console.error(`[AI_GATEWAY] [EXHAUSTED] All ${triedCredentials.size} keys failed for requestId=${requestId}`);
  return {
    success: false,
    error: {
      code: "ALL_AI_PROVIDERS_EXHAUSTED",
      message: lastError?.message || "सभी AI स्लॉट्स इस समय व्यस्त हैं या सीमा पार हो चुकी है। कृपया 10 सेकंड बाद पुनः प्रयास करें।"
    }
  };
}
