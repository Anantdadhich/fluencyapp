import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Type, Schema } from "@google/genai";
import { generateGeminiContent } from "@/lib/gemini";

export const runtime = "nodejs";

const vocabPracticeSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    themeTitle: { type: Type.STRING },
    themeDescription: { type: Type.STRING },
    words: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          partOfSpeech: { type: Type.STRING, description: "e.g. noun, verb, adjective, adverb" },
          meaning: { type: Type.STRING, description: "Clear definition of the word" },
          environment: { type: Type.STRING, description: "e.g., 'Formal Corporate', 'General Networking', 'Casual Social', etc." },
          situationalContext: { type: Type.STRING, description: "Detailed explanation of the social or professional setting, what register of speech this belongs to, and how to use it safely." },
          contextualExample: { type: Type.STRING, description: "Example sentence showing the word naturally applied in the target environment" },
          quizQuestion: {
            type: Type.OBJECT,
            properties: {
              scenario: { type: Type.STRING, description: "A realistic scenario matching the environment where this word is key." },
              options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Provide 3 multiple-choice options showing different phrasings. One option should correctly and naturally use the word. The other two should be either grammatically wrong, too aggressive, or completely inappropriate registers." },
              correctIndex: { type: Type.INTEGER, description: "0-based index of correct option" },
              explanation: { type: Type.STRING, description: "Why the correct option fits the situation/environment, and why the other options fail or sound out of place." }
            },
            required: ["scenario", "options", "correctIndex", "explanation"]
          }
        },
        required: ["word", "partOfSpeech", "meaning", "environment", "situationalContext", "contextualExample", "quizQuestion"]
      }
    }
  },
  required: ["themeTitle", "themeDescription", "words"]
};

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const apiKey = cookieStore.get("gemini_api_key")?.value;

    if (!apiKey) {
      return NextResponse.json({ error: "Unauthorized: Missing API Key" }, { status: 401 });
    }

    const { theme } = await request.json();

    if (!theme) {
      return NextResponse.json({ error: "Missing vocabulary theme" }, { status: 400 });
    }

    const today = new Date().toDateString();

    const prompt = `
You are an expert English Communications Coach specializing in C1/C2 advanced native speaker nuances.
Today's date is: "${today}". Use this date as a seed to ensure the vocabulary words are unique for today and vary daily.

Generate a structured advanced vocabulary class for the theme: "${theme}".

Available themes:
- executive: Executive communication, boardrooms, and pitching to management.
- networking: General professional networking, casual business social events, and coffee chats.
- negotiation: Conflict resolution, debates, compromise, and commercial negotiations.
- academic: Research presentations, analytical writing, essays, and reports.

Instructions:
1. Provide a "themeTitle" and a "themeDescription" for this vocabulary class.
2. Select exactly 3 highly advanced, C1/C2 or native-level words, idioms, or high-impact professional expressions suitable for this theme. Do not choose simple or common words (like 'analyze', 'lead', or 'agree'). Choose sophisticated words (like 'obviate', 'bifurcate', 'acquiesce', or 'equivocate').
3. For each word, explain:
   - Part of speech.
   - Core meaning.
   - The specific "environment" where this word shines.
   - The "situationalContext": outline when it's appropriate to say this word, the social/professional nuance, and the vibe it projects. For example, explain how it differs from basic or intermediate alternatives, what impression it gives to superiors or network contacts, and warning signs of misuse.
   - Provide a natural "contextualExample" sentence.
4. Add a "quizQuestion" scenario-based multiple choice question. Ensure the incorrect choices demonstrate typical non-native register traps (e.g. using a stiff word in a casual coffee chat, or a casual word in a board briefing).
5. In the "explanation", provide a simple, clear explanation in plain English (avoiding complex academic jargon). You MUST explicitly list and break down EVERY single option/choice (both the correct one and all wrong choices) by explaining why it fits or fails in the target environment, giving a clear example sentence for each. Use bullet points and clear bold headings for each option. Keep the language simple, direct, and helpful.

Output strictly valid JSON matching the requested schema.
`;

    const outputText = await generateGeminiContent({
      apiKey,
      prompt,
      responseSchema: vocabPracticeSchema,
    });
    if (!outputText) {
       throw new Error("No vocabulary output generated");
    }

    const result = JSON.parse(outputText);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Vocabulary Generator Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate vocabulary class" }, { status: 500 });
  }
}
