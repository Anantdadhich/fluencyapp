import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Type, Schema } from "@google/genai";
import { generateGeminiContent } from "@/lib/gemini";

export const runtime = "nodejs";

const shadowSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    phrases: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          phrase: { type: Type.STRING, description: "A natural, warm, and idiomatic English sentence designed for easy speaking rhythm." },
          context: { type: Type.STRING, description: "When and where to use this phrase (e.g., 'Meeting a new team member' or 'Starting a friendly conversation')." },
          tip: { type: Type.STRING, description: "Vocal coaching tip on breathing, linking words, or intonation." }
        },
        required: ["id", "phrase", "context", "tip"]
      }
    }
  },
  required: ["phrases"]
};

const mirrorSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    evaluation: {
      type: Type.OBJECT,
      properties: {
        overallAffirmation: { type: Type.STRING, description: "Warm, encouraging praise congratulating the learner for speaking up and expressing themselves clearly." },
        flowScore: { type: Type.INTEGER, description: "A score from 1 to 10 assessing vocal flow, confidence, and natural completion of thought." },
        confidenceWins: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "2 or 3 specific positive points highlighting what sounded natural, clear, or well-structured."
        },
        smoothTransitions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Examples of good linking words or phrases the learner used successfully."
        },
        gentleUpgrade: {
          type: Type.OBJECT,
          properties: {
            original: { type: Type.STRING, description: "A phrase from the user's speech that could sound slightly more natural." },
            encouragingSuggestion: { type: Type.STRING, description: "An encouraging alternative phrase." },
            whyItSoundsNatural: { type: Type.STRING, description: "Explanation of why this alternative flows smoothly." }
          },
          required: ["original", "encouragingSuggestion", "whyItSoundsNatural"]
        }
      },
      required: ["overallAffirmation", "flowScore", "confidenceWins", "smoothTransitions"]
    }
  },
  required: ["evaluation"]
};

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const apiKey = cookieStore.get("gemini_api_key")?.value;

    if (!apiKey) {
      return NextResponse.json({ error: "Unauthorized: Missing API Key" }, { status: 401 });
    }

    const body = await request.json();
    const { mode, topic = "Everyday Friendly Conversation", text = "" } = body;

    if (mode === "shadow") {
      const prompt = `
You are an expert Vocal & Fluency Coach specializing in helping shy English learners overcome nervousness.
Generate 5 warm, natural, idiomatic sentences for shadowing (listen & repeat) practice on the topic of "${topic}".
Each phrase should have an easy, conversational rhythm that builds confidence. Include a clear situational context and a vocal delivery tip (e.g., pausing, breath support, word stress).
Output strictly valid JSON matching the schema.
`;
      const outputText = await generateGeminiContent({
        apiKey,
        prompt,
        responseSchema: shadowSchema,
      });

      if (!outputText) throw new Error("Failed to generate shadow phrases");
      const parsed = JSON.parse(outputText);
      return NextResponse.json(parsed);
    } else if (mode === "mirror") {
      if (!text.trim()) {
        return NextResponse.json({ error: "Missing spoken text for evaluation" }, { status: 400 });
      }

      const prompt = `
You are an empathetic, world-class English Vocal Coach and Fluency Mentor evaluating a shy learner in the "Judgment-Free Mirror Zone".
The learner just spoke the following thoughts:
"${text}"

CRITICAL COACHING RULE: DO NOT focus on minor syntax errors or grammar mistakes. DO NOT criticize.
Your goal is to build immense speaking confidence, validate their willingness to speak, and praise their communication flow.
Provide an encouraging affirmation, score their flow (be generous and supportive, e.g. 7-10), highlight specific confidence wins, and offer one optional gentle upgrade phrasing phrased as a supportive tip.
Output strictly valid JSON matching the schema.
`;
      const outputText = await generateGeminiContent({
        apiKey,
        prompt,
        responseSchema: mirrorSchema,
      });

      if (!outputText) throw new Error("Failed to generate mirror evaluation");
      const parsed = JSON.parse(outputText);
      return NextResponse.json(parsed);
    } else {
      return NextResponse.json({ error: "Invalid practice mode" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Confidence API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
