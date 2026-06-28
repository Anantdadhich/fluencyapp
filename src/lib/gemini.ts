import { GoogleGenAI, Schema } from "@google/genai";

interface GenerateContentOptions {
  apiKey: string;
  prompt: string;
  responseSchema?: Schema;
}

// Fallback order of models to maximize speed and guarantee availability
const MODELS_FALLBACK_ORDER = [
  "gemini-2.5-flash-lite",       // Primary: Extremely low latency, highest availability
  "gemini-2.0-flash-lite",       // Secondary fallback: Very fast and stable
  "gemini-2.5-flash",            // Tertiary fallback: Standard flash
  "gemini-3.1-flash-lite"        // Quaternary fallback: Next-gen fast lite
];

export async function generateGeminiContent({ apiKey, prompt, responseSchema }: GenerateContentOptions): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  let lastError: any = null;

  const isDev = process.env.NODE_ENV !== "production";

  for (const model of MODELS_FALLBACK_ORDER) {
    const maxRetries = 2;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (isDev) {
          console.log(`[Gemini API] Requesting ${model} (attempt ${attempt}/${maxRetries})`);
        }
        
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: responseSchema ? "application/json" : "text/plain",
            responseSchema,
          }
        });

        const text = response.text;
        if (text) {
          if (isDev) {
            console.log(`[Gemini API] Successfully generated response using model: ${model}`);
          }
          return text;
        }
      } catch (error: any) {
        lastError = error;
        if (isDev) {
          console.warn(`[Gemini API] Error with ${model} on attempt ${attempt}:`, error.message || error);
        }
        
        // Critical error check (e.g., unauthorized key or bad request structures shouldn't retry or fall back)
        if (
          error.status === 400 || 
          error.status === 403 || 
          error.message?.includes("API key") || 
          error.message?.includes("UNAUTHORIZED")
        ) {
          throw error;
        }

        // Wait short delay for transient errors/rate limits
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }
  }

  throw new Error(`All Gemini models failed. Last error: ${lastError?.message || lastError}`);
}
