import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json({ error: "Invalid API Key" }, { status: 400 });
    }

    // Set HttpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set("gemini_api_key", apiKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const hasKey = cookieStore.has("gemini_api_key");
  return NextResponse.json({ hasKey });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("gemini_api_key");
  return NextResponse.json({ success: true });
}
