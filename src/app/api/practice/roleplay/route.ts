import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Type, Schema } from "@google/genai";
import { generateGeminiContent } from "@/lib/gemini";

export const runtime = "nodejs";

const roleplaySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    nextMessage: { type: Type.STRING, description: "The character's next spoken dialogue response in character, keeping the conversation going." },
    evaluation: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER, description: "1-10 rating on how appropriate, professional, and register-suitable the user's latest statement was for the scenario." },
        feedback: { type: Type.STRING, description: "Detailed, constructive feedback on their tone, vocabulary, and phrasing." },
        grammarErrors: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of syntax, grammar, or spelling errors found in their latest statement (empty if none)."
        },
        alternativeSuggestion: { type: Type.STRING, description: "A polished, natural, native-level rewrite of their statement that maintains the exact same meaning but sounds much more professional and native." }
      },
      required: ["score", "feedback", "grammarErrors", "alternativeSuggestion"]
    }
  },
  required: ["nextMessage", "evaluation"]
};

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const apiKey = cookieStore.get("gemini_api_key")?.value;

    if (!apiKey) {
      return NextResponse.json({ error: "Unauthorized: Missing API Key" }, { status: 401 });
    }

    const { scenario, history } = await request.json();

    if (!scenario || !history || !Array.isArray(history)) {
      return NextResponse.json({ error: "Missing required parameters (scenario, history)" }, { status: 400 });
    }

    // Format history for the prompt context
    const formattedHistory = history
      .map((msg: any) => `${msg.sender.toUpperCase()}: "${msg.text}"`)
      .join("\n");

    const prompt = `
You are an expert English Speech Coach and an actor playing a character in a realistic roleplay scenario.

Scenario: "${scenario}"

Characters and contexts for default scenarios:
- salary: You are "Arthur Vance", a demanding, cost-conscious VP of Operations. The user is a mid-level engineer requesting a salary review. You are tough, strict, but fair.
- venture: You are "Elena Rostova", a brilliant, analytical Venture Capitalist. The user is pitching their software startup. You want to see strong value propositions, product-market fit, and clear responses, and you dislike generic buzzwords.
- networking: You are "Dr. Marcus Brody", a friendly but busy Senior Researcher at a tech conference coffee break. The user is striking up a conversation to network.
- client: You are "Sarah Jenkins", a frustrated, high-paying corporate client. The user's team just had a massive software outage that disrupted your services. You want a sincere apology, clear explanation, and action items.

If the scenario does not match the default ones, adapt your character to the custom scenario provided by the user.

Conversation History so far:
${formattedHistory}

Instructions:
1. Review the conversation history. Read the user's latest response carefully.
2. Formulate the character's "nextMessage" response. Speak directly in-character (Arthur, Elena, Marcus, or Sarah). Keep the dialogue natural, conversational, and realistic. Conclude your turn with a follow-up question or transition to keep the conversation going. Keep the message under 60-80 words.
3. Conduct a structural evaluation of the user's latest statement:
   - Grade register suitability (1 to 10 score) based on how appropriate their tone, politeness, and level of formality are for the counterpart.
   - List grammatical/spelling/syntax mistakes in "grammarErrors".
   - Provide coaching advice in "feedback" (e.g. why their phrase sounds too stiff or informal, or how to convey more authority).
   - Write a polished, native-level alternative in "alternativeSuggestion" to model how a native speaker would frame that exact thought.

Output strictly valid JSON matching the requested schema.
`;

    const outputText = await generateGeminiContent({
      apiKey,
      prompt,
      responseSchema: roleplaySchema,
    });

    if (!outputText) {
       throw new Error("No response generated");
    }

    const result = JSON.parse(outputText);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Roleplay API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process roleplay turn" }, { status: 500 });
  }
}
