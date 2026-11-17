import { GoogleGenAI } from "@google/genai";

export interface AIRequestContext {
  modality: "text" | "image" | "document" | "multimodal";
  requiresVision: boolean;
  requiresLongContext?: boolean;
  preferredProvider?: "gemini";
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
    const fallbackModel = primaryModel === "gemini-2.5-flash" ? "gemini-1.5-flash" : "gemini-2.5-flash";

    let response: any = null;
    let usedModel = primaryModel;

    const requestConfig: any = {
      config: {
        temperature
      }
    };

    if (systemInstruction) {
      requestConfig.config.systemInstruction = systemInstruction;
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
      requestConfig.model = primaryModel;
      response = await ai.models.generateContent(requestConfig);
    } catch (primaryErr: any) {
      console.warn(`[Gemini Gateway] Primary model ${primaryModel} failed, trying fallback ${fallbackModel}:`, primaryErr?.message);
      try {
        requestConfig.model = fallbackModel;
        usedModel = fallbackModel;
        response = await ai.models.generateContent(requestConfig);
      } catch (fallbackErr: any) {
        throw fallbackErr;
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
