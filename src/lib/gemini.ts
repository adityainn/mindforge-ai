import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";

if (!apiKey) {
  console.warn("Warning: GEMINI_API_KEY is not defined in environment variables.");
}

console.log("Loading Gemini API Key in src/lib/gemini.ts:", apiKey ? apiKey.slice(0, 10) + "..." + apiKey.slice(-5) : "UNDEFINED");
export const genAI = new GoogleGenerativeAI(apiKey);

export const getGeminiModel = (modelName = "gemini-1.5-flash") => {
  return genAI.getGenerativeModel({
    model: modelName,
  });
};

/**
 * Generates content using Gemini API with automatic model fallbacks (e.g. gemini-1.5-flash, gemini-2.5-flash)
 * to handle temporary 503 Service Unavailable or 429 Rate Limit errors.
 */
export async function generateContentWithFallback(prompt: string, jsonMode = false) {
  const models = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
  let lastError: any = null;

  for (const modelName of models) {
    try {
      console.log(`[Gemini API] Attempting generation with model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const reqPayload: any = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      };

      if (jsonMode) {
        reqPayload.generationConfig = {
          responseMimeType: "application/json",
        };
      }

      const result = await model.generateContent(reqPayload);
      console.log(`[Gemini API] Generation successful with model: ${modelName}`);
      return result;
    } catch (error: any) {
      console.warn(`[Gemini API] Model ${modelName} failed. Status: ${error.status || "Error"}. Message: ${error.message || error}`);
      lastError = error;
    }
  }

  throw lastError;
}
