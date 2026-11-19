import { GoogleGenAI } from "@google/genai";

export interface AIRequestContext {
  modality: "text" | "image" | "document" | "multimodal";
  requiresVision: boolean;
  requiresLongContext?: boolean;
  preferredProvider?: "gemini";
  modelPreference?: string;
  systemInstruction?: string;
  thinkingBudget?: number;
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

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || 
                 process.env.VITE_GEMINI_API_KEY || 
                 process.env.GOOGLE_API_KEY || 
                 process.env.API_KEY || "";
  
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }

  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'ascend-study-direct-gemini-engine'
        }
      }
    });
  }
  return aiClient;
}

export function initializeGateway() {
  // Direct Gemini engine initialization
  getAiClient();
}

export async function executeAIRequest(
  context: AIRequestContext, 
  promptOrParams: any
): Promise<NormalizedAIResponse> {
  const ai = getAiClient();
  if (!ai) {
    return {
      success: false,
      error: {
        code: "CONFIG_ERROR",
        message: "Gemini API key is not configured on the server. Please check your environment variables."
      }
    };
  }

  try {
    let promptContent = "";
    let systemInstruction = context.systemInstruction;
    let temperature = 0.7;
    let imagesBase64: string[] = [];

    if (typeof promptOrParams === "string") {
      promptContent = promptOrParams;
    } else if (promptOrParams && typeof promptOrParams === "object") {
      promptContent = promptOrParams.contents || promptOrParams.prompt || "";
      if (promptOrParams.config?.temperature !== undefined) {
        temperature = promptOrParams.config.temperature;
      }
      if (promptOrParams.systemInstruction) {
        systemInstruction = promptOrParams.systemInstruction;
      }
      if (promptOrParams.imagesBase64 && Array.isArray(promptOrParams.imagesBase64)) {
        imagesBase64 = promptOrParams.imagesBase64;
      } else if (promptOrParams.imageBase64) {
        imagesBase64 = [promptOrParams.imageBase64];
      }
    }

    const primaryModel = context.modelPreference || "gemini-2.5-flash";
    const usedModel = primaryModel;

    let response: any = null;

    const requestConfig: any = {
      model: primaryModel,
      config: {
        temperature
      }
    };

    if (systemInstruction) {
      requestConfig.config.systemInstruction = systemInstruction;
    }

    if (primaryModel.startsWith("gemini-2.5-flash")) {
      requestConfig.config.thinkingConfig = { thinkingBudget: context.thinkingBudget ?? 0 };
    }

    // Build contents array supporting multimodal images if present
    let contents: any = promptContent;
    if (imagesBase64.length > 0) {
      contents = [
        promptContent,
        ...imagesBase64.map(b64 => ({
          inlineData: {
            data: b64.replace(/^data:image\/[a-z]+;base64,/, ''),
            mimeType: 'image/jpeg'
          }
        }))
      ];
    }
    requestConfig.contents = contents;

    try {
      response = await ai.models.generateContent(requestConfig);
    } catch (err: any) {
      const status = err?.status || err?.code || '';
      const msg = (err?.message || '').toUpperCase();
      const is503OrOverloaded = status === 503 || status === '503' || status === 503000 || msg.includes('UNAVAILABLE') || msg.includes('OVERLOADED');
      if (is503OrOverloaded) {
        console.warn(`[Gemini Gateway] Model ${primaryModel} returned 503/overloaded, waiting 700ms to retry once...`, err?.message);
        await new Promise(resolve => setTimeout(resolve, 700));
        response = await ai.models.generateContent(requestConfig);
      } else {
        throw err;
      }
    }

    const text = response?.text || "";

    return {
      success: true,
      text,
      provider: "gemini",
      model: usedModel,
      usage: {
        inputTokens: response.usageMetadata?.promptTokenCount,
        outputTokens: response.usageMetadata?.candidatesTokenCount,
        totalTokens: response.usageMetadata?.totalTokenCount
      }
    };
  } catch (err: any) {
    console.error("[Direct Gemini Engine Error]:", err);
    return {
      success: false,
      error: {
        code: err?.status || err?.code || "GEMINI_ERROR",
        message: err?.message || String(err)
      }
    };
  }
}

export function getProviderHealth() {
  return {
    provider: "gemini",
    model: "gemini-2.5-flash",
    status: "active",
    configured: !!getAiClient()
  };
}
