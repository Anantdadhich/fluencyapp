import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Type, Schema } from "@google/genai";
import { generateGeminiContent } from "@/lib/gemini";

export const runtime = "nodejs";

const teleprompterSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    speechText: { type: Type.STRING, description: "A speech or paragraph of 120-150 words designed for reading aloud. Include good punctuation (commas, dashes) for rhythm and pacing." },
    stressedWords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Exactly 5-8 key words from the speechText that the speaker should emphasize or stress to sound natural and confident."
    },
    tips: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Exactly 3 bullet points detailing tonality, breath control, and pronunciation tips specifically for this generated speech."
    }
  },
  required: ["title", "speechText", "stressedWords", "tips"]
};

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const apiKey = cookieStore.get("gemini_api_key")?.value;

    if (!apiKey) {
      return NextResponse.json({ error: "Unauthorized: Missing API Key" }, { status: 401 });
    }

    const { category } = await request.json();

    if (!category) {
      return NextResponse.json({ error: "Missing speech topic or category" }, { status: 400 });
    }

    const today = new Date().toDateString();

    const prompt = `
You are an expert English Speech Coach and Toastmasters Design Lead.
Today's date is: "${today}". Use this date as a seed to ensure the generated speech varies daily.

Generate an oral reading practice text.
The topic/category selected is: "${category}".
If the category is one of the four default styles (speaking, corporate, storytelling, philosophical), generate a speech matching that style. Otherwise, treat "${category}" as a custom user-defined topic/scenario and generate a highly engaging, custom speech specifically about that scenario.

Instructions:
1. Generate a title for the speech.
2. Generate a highly rhythmic, engaging speech text (120-150 words) with expressive punctuation (commas, semicolons, em-dashes, and exclamation marks) that naturally guide tonality, pauses, and speech speed.
3. Identify exactly 5-8 key words from the speech text that the speaker should emphasize or stress to project confidence and natural native-like cadence. Output them in "stressedWords".
4. Provide exactly 3 helpful speech tips tailored specifically to the style, pacing, and rhythm of this generated text.

Output strictly valid JSON matching the requested schema.
`;

    const outputText = await generateGeminiContent({
      apiKey,
      prompt,
      responseSchema: teleprompterSchema,
    });

    if (!outputText) {
       throw new Error("No speech generated");
    }

    const result = JSON.parse(outputText);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Teleprompter Generator Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate speech" }, { status: 500 });
  }
}
