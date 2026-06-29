import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Type, Schema } from "@google/genai";
import { generateGeminiContent, cleanJsonString } from "@/lib/gemini";

// Ensure Node.js runtime as `@google/genai` handles network requests
export const runtime = "nodejs";

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    analytics: {
      type: Type.OBJECT,
      properties: {
        nuanceScores: {
          type: Type.OBJECT,
          properties: {
            formal: { type: Type.INTEGER, description: "1-10 score" },
            casual: { type: Type.INTEGER, description: "1-10 score" },
            aggressive: { type: Type.INTEGER, description: "1-10 score" },
            poetic: { type: Type.INTEGER, description: "1-10 score" },
            stiff: { type: Type.INTEGER, description: "1-10 score" }
          },
          required: ["formal", "casual", "aggressive", "poetic", "stiff"]
        },
        registers: {
          type: Type.OBJECT,
          properties: {
            friend: { type: Type.STRING, description: "Rewritten for texting a friend" },
            boss: { type: Type.STRING, description: "Rewritten for emailing a boss" },
            academic: { type: Type.STRING, description: "Rewritten for academic paper" }
          },
          required: ["friend", "boss", "academic"]
        }
      },
      required: ["nuanceScores", "registers"]
    },
    highlights: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          substring: { type: Type.STRING, description: "Exact matching substring from the text" },
          indexStart: { type: Type.INTEGER, description: "Start index of substring" },
          indexEnd: { type: Type.INTEGER, description: "End index of substring" },
          type: { type: Type.STRING, description: "Type of error: collocation, vocabulary, or grammar" },
          correction: { type: Type.STRING, description: "Suggested correction" },
          explanation: { type: Type.STRING, description: "Why this is an error" }
        },
        required: ["substring", "indexStart", "indexEnd", "type", "correction", "explanation"]
      }
    },
    vocabularyUpgrades: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          originalPhrase: { type: Type.STRING },
          recommendedSynonym: { type: Type.STRING },
          targetSituation: { type: Type.STRING },
          contextualExample: { type: Type.STRING }
        },
        required: ["originalPhrase", "recommendedSynonym", "targetSituation", "contextualExample"]
      }
    },
    grammarAnalysis: {
      type: Type.OBJECT,
      properties: {
        tense: { type: Type.STRING, description: "The grammatical tense used in the input" },
        sentenceStructure: { type: Type.STRING, description: "The grammatical structure of the sentence" },
        educationalLesson: { type: Type.STRING, description: "A mini-lesson explaining the grammar rules used" }
      },
      required: ["tense", "sentenceStructure", "educationalLesson"]
    }
  },
  required: ["analytics", "highlights", "vocabularyUpgrades", "grammarAnalysis"]
};

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const apiKey = cookieStore.get("gemini_api_key")?.value;

    if (!apiKey) {
      return NextResponse.json({ error: "Unauthorized: Missing API Key" }, { status: 401 });
    }

    const { text, audio, mimeType } = await request.json();

    if (!text && !audio) {
      return NextResponse.json({ error: "No input provided" }, { status: 400 });
    }

    let transcribedText = text || "";
    if (audio) {
      try {
        const transcript = await generateGeminiContent({
          apiKey,
          prompt: "Transcribe this spoken audio exactly, word-for-word. Output only the transcript text. Do not add any prefix, suffix, or headers.",
          audio: {
            data: audio,
            mimeType: mimeType || "audio/webm"
          }
        });
        const cleanTranscript = transcript.trim();
        transcribedText = text 
          ? `${text.trim()} ${cleanTranscript}` 
          : cleanTranscript;
      } catch (err: any) {
        console.error("Audio transcription error:", err);
        // Fall back to text if transcription fails
      }
    }

    // Handle god prompt
    const prompt = `
You are an advanced English Fluency Engine for intermediate-to-native learners.
Analyze the following user input deeply. Provide comprehensive structural feedback, identify language traps, and explicitly teach the grammar rules.

Input Text:
"""
${transcribedText}
"""

Instructions:
1. Provide a nuance score (1-10) for formal, casual, aggressive, poetic, and stiff.
2. Rewrite the thought into three distinct registers: friend, boss, academic.
3. Identify highlights where the user made an error or could improve. Include the exact substring and index.
4. IMPORTANT: You MUST provide at least 2 \`vocabularyUpgrades\`. Even if the input is simple or perfectly correct (like "I am eating snacks"), provide an advanced or native-level alternative (e.g., "I am currently snacking" or "I am having some refreshments").
5. Grammar Analysis: Identify the grammatical tense and sentence structure used. Provide a clear \`educationalLesson\` explaining how this grammar rule is formed and when to use it.

Output strictly valid JSON matching the requested schema.
`;

    // Wait for the Gemini SDK to process
    const outputText = await generateGeminiContent({
      apiKey,
      prompt,
      responseSchema,
    });
    if (!outputText) {
       throw new Error("No output generated");
     }

    const cleanedJson = cleanJsonString(outputText);
    const result = JSON.parse(cleanedJson);
    result.transcribedText = transcribedText;
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to analyze text" }, { status: 500 });
  }
}
