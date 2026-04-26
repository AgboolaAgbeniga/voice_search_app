import { NextRequest, NextResponse } from "next/server";
import { getNvidiaClient, getModel } from "@/lib/nvidia-client";

// ─── Main Route ───────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query?.trim()) {
      return NextResponse.json({ error: "Query is required." }, { status: 400 });
    }

    const model = getModel();

    // Build prompt for direct answer
    const systemPrompt = `You are a helpful AI assistant. Answer the user's question clearly, concisely, and directly.
Provide a direct summary answer in 1-2 sentences max. Do not include any fluff or introductory phrases. Just the facts.`;

    // Call NVIDIA API
    const client = getNvidiaClient();
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query },
      ],
      max_tokens: 512,
      temperature: 0.7,
    });

    const answer = completion.choices[0]?.message?.content ?? "No response generated.";

    return NextResponse.json({
      answer,
      model,
    });
  } catch (err: unknown) {
    console.error("[/api/search] Error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
