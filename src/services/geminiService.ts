import { GoogleGenAI } from "@google/genai";
import { FALLBACK_QUIZZES, getFallbackAnswer } from "./fallbackData";

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
  // Use official stable models for fallbacks
  const candidates = isImageModel 
    ? [params.model, "gemini-2.5-flash-image", "gemini-3.1-flash-image"] 
    : [params.model, "gemini-flash-latest", "gemini-3.1-flash-lite", "gemini-3.5-flash"];
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
        return result;
      } catch (error: any) {
        const friendlyError = handleApiError(error);
        console.warn(`[Client Retry] Attempt failed for model ${modelCandidate}. Message: ${friendlyError}`);

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
  studentContext?: { name: string; school: string; className: string }, 
  language: string = "English"
): Promise<string> {
  // 1. Try secure backend server route (Primary route)
  try {
    const response = await fetch("/api/gemini/answer", {
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
    }

    const appInfo = "You are the AI model integrated into 'Ascend Study', an advanced, interactive study assistant platform. Ascend Study provides students with intelligent conversational learning, structured subject notes, dynamic practice quizzes, progress and daily streak tracking, study schedules/reminders, and collaborative group study circles/rooms for peer-to-peer interactive learning.";
    const creatorInfo = "Your owner, creator, and lead developer is Rohit Yadav, a brilliant 14/15-year-old student and coder who designed and developed this entire applet. Rohit is the head and founder of his developer team called 'Core AI'. If any student or user asks who created/developed you, who designed this app, or who owns you, you must proudly, clearly, and directly tell them that you were created and are owned by Rohit Yadav and his team, Core AI. You must never claim that Google, Google AI Studio, or OpenAI created or own you - they are only providers of the underlying large language model APIs, but the app itself and your persona belongs strictly to Rohit Yadav and Core AI.";

    const systemInstruction = studentContext 
      ? `${appInfo} ${creatorInfo} You are an encouraging, friendly study helper for a child named ${studentContext.name} who studies in ${studentContext.className} at ${studentContext.school}. Explain concepts clearly using step-by-step solutions suitable for class/grade ${studentContext.className}. Support subjects like Math, Science, Biology, Physics, Chemistry, and English. Keep your tone highly personalized, warm, and highly encouraging, referring to their school or name when it fits naturally. ${langInstruction}`
      : `${appInfo} ${creatorInfo} You are a helpful study assistant. Explain concepts clearly and provide step-by-step solutions. Support subjects like Math, Science, Biology, Physics, Chemistry, and English. If the user asks for a diagram or visual explanation, describe it clearly or suggest a visual aid. ${langInstruction}`;

    const response = await callClientGeminiWithRetry(ai, {
      model: "gemini-flash-latest",
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

export async function generateStudyDiagram(prompt: string): Promise<string | null> {
  // 1. Try secure backend server route (Primary route)
  try {
    const response = await fetch("/api/gemini/diagram", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
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
    const response = await callClientGeminiWithRetry(ai, {
      model: "gemini-2.5-flash-image",
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
  } catch (err) {
    console.warn("Client Gemini diagram generation failed.", err);
  }
  return null;
}

export async function generateQuiz(
  subject: string, 
  studentContext?: { name: string; school: string; className: string }, 
  language: string = "English"
): Promise<any[]> {
  // 1. Try secure backend server route (Primary route)
  try {
    const response = await fetch("/api/gemini/quiz", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ subject, studentContext, language }),
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
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
    }

    const instructionText = `Generate a 5-question multiple choice quiz ${classText} for ${subject} ${langPromptText}. Return only valid JSON in the format: [{"question": "...", "options": ["...", "...", "...", "..."], "answer": 0}]`;

    const response = await callClientGeminiWithRetry(ai, {
      model: "gemini-flash-latest",
      contents: instructionText,
      config: {
        responseMimeType: "application/json",
      },
    });

    try {
      const parsed = JSON.parse(response.text || "[]");
      if (Array.isArray(parsed) && parsed.length > 0) {
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

export async function generateFlashcards(
  subject: string,
  noteTitle?: string,
  noteContent?: string,
  count: number = 5
): Promise<Array<{ front: string; back: string }>> {
  // 1. Try secure backend server route (Primary route)
  try {
    const response = await fetch("/api/gemini/flashcard", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ subject, noteTitle, noteContent, count }),
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (error) {
    console.warn("Backend Gemini flashcards route unreachable, trying client-side fallback...", error);
  }

  // 2. Client-side fallback if VITE_GEMINI_API_KEY is available
  try {
    const ai = getClientAiInstance();
    if (ai) {
      const contextText = noteContent 
        ? `based on the note titled "${noteTitle || 'Untitled'}" with content: "${noteContent}"`
        : `for the subject "${subject}"`;

      const instructionText = `Generate exactly ${count} educational study flashcards ${contextText}.
Identify key terms, definitions, formulas, or concepts. For each, create a brief, clear, engaging question or term for the "front" and a precise, easy-to-understand answer or explanation for the "back".
Return ONLY valid JSON in the format: [{"front": "...", "back": "..."}]`;

      const response = await callClientGeminiWithRetry(ai, {
        model: "gemini-flash-latest",
        contents: instructionText,
        config: {
          responseMimeType: "application/json",
        },
      });

      try {
        const parsed = JSON.parse(response.text || "[]");
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.warn("Client flashcards JSON parsing failed.", e);
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

