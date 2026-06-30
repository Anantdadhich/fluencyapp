import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Type, Schema } from "@google/genai";
import { generateGeminiContent, cleanJsonString } from "@/lib/gemini";

export const runtime = "nodejs";

const speechEvaluationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    clarityScore: { type: Type.INTEGER, description: "1-10 rating of how clearly the speaker articulated the words based on transcript matches" },
    rhythmScore: { type: Type.INTEGER, description: "1-10 rating of breathing intervals, pauses, and cadence" },
    expressionScore: { type: Type.INTEGER, description: "1-10 rating of the emotional beats and tonality delivery" },
    feedback: { type: Type.STRING, description: "Comprehensive coaching feedback on their performance, delivery style, and speech suggestions" },
    mispronunciations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of words that were skipped, substituted, or likely mispronounced based on comparison."
    },
    tonalityAnalysis: { type: Type.STRING, description: "A detailed breakdown of their tone (e.g. was it stiff, casual, monotonous, or dynamic?)." }
  },
  required: ["clarityScore", "rhythmScore", "expressionScore", "feedback", "mispronunciations", "tonalityAnalysis"]
};

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const apiKey = cookieStore.get("gemini_api_key")?.value;

    if (!apiKey) {
      return NextResponse.json({ error: "Unauthorized: Missing API Key" }, { status: 401 });
    }

    const { originalText, transcript } = await request.json();

    if (!originalText || !transcript) {
      return NextResponse.json({ error: "Missing required parameters (originalText, transcript)" }, { status: 400 });
    }

    const prompt = `
You are an expert English Speech Coach and Pronunciation Expert.
Evaluate the user's spoken performance by comparing the original text they were supposed to read with the speech-to-text transcript of what they actually said.

Original Text to read:
"""
${originalText}
"""

Spoken Transcript (Speech-to-Text):
"""
${transcript}
"""

Instructions:
1. Compare the two texts. Identify any skipped words, added words, or phonetically mismatched words (mispronunciations).
2. Rate their clarity (articulation accuracy), rhythm (natural pauses and breathing cadence), and expression (tonality variety) on a scale from 1 to 10.
3. Provide comprehensive coaching feedback in "feedback". Be encouraging but precise, pointing out areas for speech flow improvement.
4. List the specific words they struggled with or skipped in "mispronunciations".
5. Analyze their tone and expression style (e.g. monotone vs dynamic, stiffness, or natural flow) in "tonalityAnalysis".

Output strictly valid JSON matching the requested schema.
`;

    const outputText = await generateGeminiContent({
      apiKey,
      prompt,
      responseSchema: speechEvaluationSchema,
    });

    if (!outputText) {
       throw new Error("No evaluation generated");
    }

    const cleanedJson = cleanJsonString(outputText);
    const result = JSON.parse(cleanedJson);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Speech Evaluation Error:", error);
    return NextResponse.json({ error: error.message || "Failed to evaluate speech" }, { status: 500 });
  }
}
