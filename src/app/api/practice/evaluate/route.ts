import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Type, Schema } from "@google/genai";
import { generateGeminiContent } from "@/lib/gemini";

export const runtime = "nodejs";

const sentenceEvaluationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    isValid: { type: Type.BOOLEAN, description: "True if the sentence is grammatically correct and uses the word properly." },
    score: { type: Type.INTEGER, description: "1-10 rating for suitability in the specified environment." },
    feedback: { type: Type.STRING, description: "Detailed, constructive feedback on how they used the word." },
    grammarErrors: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of syntax/grammar mistakes (empty if none)." },
    registerAnalysis: { type: Type.STRING, description: "Analysis on the tone, register, and why it fits or does not fit the target environment." },
    alternativeSuggestion: { type: Type.STRING, description: "A polished, native-level rewrite of their sentence utilizing the same word." }
  },
  required: ["isValid", "score", "feedback", "grammarErrors", "registerAnalysis", "alternativeSuggestion"]
};

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const apiKey = cookieStore.get("gemini_api_key")?.value;

    if (!apiKey) {
      return NextResponse.json({ error: "Unauthorized: Missing API Key" }, { status: 401 });
    }

    const { word, sentence, environment } = await request.json();

    if (!word || !sentence || !environment) {
      return NextResponse.json({ error: "Missing required parameters (word, sentence, environment)" }, { status: 400 });
    }

    const prompt = `
You are an expert English Communications Coach.
Evaluate the user's sentence where they are practicing using a new advanced word.

Word to use: "${word}"
Target Environment: "${environment}"
User's Sentence:
"""
${sentence}
"""

Instructions:
1. Determine if the sentence is grammatically correct and uses the word "${word}" properly in context.
2. Provide a score from 1 to 10 evaluating how appropriate and natural this sentence is for the "${environment}" environment.
3. Offer constructive feedback on their word choice and usage.
4. List any grammar or spelling errors in "grammarErrors".
5. Analyze the tone/register (e.g. Is it too stiff? Too casual for a formal meeting? Just right?).
6. Give a polished, high-quality, native-level rewrite of their sentence in "alternativeSuggestion" to show them how a native speaker would frame the same thought.

Output strictly valid JSON matching the requested schema.
`;

    const outputText = await generateGeminiContent({
      apiKey,
      prompt,
      responseSchema: sentenceEvaluationSchema,
    });
    if (!outputText) {
       throw new Error("No evaluation output generated");
    }

    const result = JSON.parse(outputText);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Evaluation Endpoint Error:", error);
    return NextResponse.json({ error: error.message || "Failed to evaluate sentence" }, { status: 500 });
  }
}
