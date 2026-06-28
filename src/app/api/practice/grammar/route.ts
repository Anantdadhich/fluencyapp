import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Type, Schema } from "@google/genai";
import { generateGeminiContent } from "@/lib/gemini";

export const runtime = "nodejs";

const grammarPracticeSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    lesson: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        summary: { type: Type.STRING, description: "Brief foundation overview or rules breakdown for the chosen topic" },
        definition: { type: Type.STRING, description: "Clear definition of the selected grammatical module in simple terms" },
        whenToUse: { type: Type.STRING, description: "Explanation of when to use this grammatical structure or rules" },
        examples: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "At least 3 practical, real-world examples demonstrating the grammatical rule or topic"
        },
        keyRules: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Exactly 3 key bullet points summarizing the grammatical rules for this topic"
        }
      },
      required: ["title", "summary", "definition", "whenToUse", "examples", "keyRules"]
    },
    problems: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          type: { type: Type.STRING, description: "Must be 'multiple-choice' or 'fill-in-the-blank'" },
          sentence: { type: Type.STRING, description: "The practice sentence. For fill-in-the-blank, use underscores, e.g. 'I ___ (be) working here for 5 years.' For multiple choice, it can be a sentence containing an error or a prompt." },
          question: { type: Type.STRING, description: "Instruction, e.g. 'Fill in the blank with the correct form of the verb' or 'Identify the incorrect adjective.'" },
          options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Provide 4 options if type is multiple-choice, or empty array if fill-in-the-blank." },
          correctAnswer: { type: Type.STRING, description: "The correct option text or the exact word to fill in" },
          explanation: { type: Type.STRING, description: "Detailed grammatical explanation of the rule, why this answer is correct, and why other options are incorrect." }
        },
        required: ["id", "type", "sentence", "question", "options", "correctAnswer", "explanation"]
      }
    }
  },
  required: ["lesson", "problems"]
};

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const apiKey = cookieStore.get("gemini_api_key")?.value;

    if (!apiKey) {
      return NextResponse.json({ error: "Unauthorized: Missing API Key" }, { status: 401 });
    }

    const { topic } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: "Missing grammar topic" }, { status: 400 });
    }

    const today = new Date().toDateString();

    const prompt = `
You are an expert English Language Professor design lead specializing in high-level pedagogy.
Today's date is: "${today}". Use this date as a seed to ensure the exercises generated are unique for today and change daily.

Generate a structured learning lesson and an interactive quiz targeting C1/C2 (CEFR) extremely advanced and native-level mastery.
The topic selected is: "${topic}" (Choose from: tenses, articles, adjectives, adverbs, prepositions, pronouns, punctuation, collocations, sentence_flow).

Instructions:
1. Generate a "lesson" object containing:
   - "title": Title of the grammar lesson.
   - "summary": A brief foundation overview or rules breakdown.
   - "definition": A clear definition of the grammar topic in simple English.
   - "whenToUse": An explanation of when to apply this grammar rule or structure.
   - "examples": At least 3 clear, practical, real-world example sentences.
   - "keyRules": Exactly 3 key bullet points summarizing the grammatical rules.
2. Generate 5 distinct, high-quality, extremely challenging practice "problems" at C1/C2 level. These should target sophisticated grammatical anomalies, subtle nuances, conditional inversions (e.g. 'Had I known...'), subjunctive states, split infinitives, zero-articles for specific classes of nouns, or complex modifier placement.
3. Mix problem types: include some "multiple-choice" problems and some "fill-in-the-blank" problems.
4. Ensure the sentences and questions focus on advanced traps, register shifts, and common high-level pitfalls for intermediate-to-advanced learners.
5. In the "explanation", provide a simple, clear explanation in plain English (avoiding overly complex academic jargon).
   - For multiple-choice questions: You MUST explicitly list and explain EVERY single option/choice (both the correct one and all incorrect choices). For each option, provide a 1-sentence description/rule in simple terms, and a clear example sentence showing "when to use it" (for correct options) or "how it is used/why it fails" (for wrong options). Use bullet points and clear bold headings for each option.
   - For fill-in-the-blank questions: Explain why common wrong inputs (e.g., using 'the' instead of zero-article) are incorrect and provide simple comparative example sentences.
   Keep terms simple, direct, and helpful.

Output strictly valid JSON matching the requested schema.
`;

    const outputText = await generateGeminiContent({
      apiKey,
      prompt,
      responseSchema: grammarPracticeSchema,
    });
    if (!outputText) {
       throw new Error("No quiz output generated");
    }

    const result = JSON.parse(outputText);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Grammar Generator Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate grammar problems" }, { status: 500 });
  }
}
