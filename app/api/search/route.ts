import { NextRequest, NextResponse } from "next/server";
import { getNvidiaClient, getModel } from "@/lib/nvidia-client";
import { getWebResults } from "@/lib/search-providers";

// ─── Main Route ───────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { query, model: requestedModel, history = [] } = await req.json();

    if (!query?.trim()) {
      return NextResponse.json({ error: "Query is required." }, { status: 400 });
    }

    const model = getModel(requestedModel);

    // 1. Fetch web results if any keys are provided
    const webResults = await getWebResults(query);
    const hasWebResults = webResults.length > 0;

    // 2. Build messages for the API
    const systemPrompt = hasWebResults
      ? `You are a helpful AI assistant. Answer the user's question clearly, concisely, and directly using the provided search results.
Provide a direct summary answer in 1-2 sentences max. Maintain context from the previous conversation if applicable.`
      : `You are a helpful AI assistant. Answer the user's question clearly, concisely, and directly.
Provide a direct summary answer in 1-2 sentences max. Do not include any fluff. Maintain context from the previous conversation.`;

    const userContent = hasWebResults
      ? `Question: ${query}\n\nSearch Results:\n${webResults.map(r => `${r.title}: ${r.snippet}`).join("\n\n")}`
      : query;

    // Build the message thread
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.map((h: any) => ([
        { role: "user", content: h.question },
        { role: "assistant", content: h.answer }
      ])).flat().slice(-6), // Keep last 3 exchanges (6 messages) for context
      { role: "user", content: userContent },
    ];

    // 3. Call NVIDIA API
    const client = getNvidiaClient();
    const completion = await client.chat.completions.create({
      model,
      messages: messages as any,
      max_tokens: 512,
      temperature: 0.7,
    });

    const answer = completion.choices[0]?.message?.content ?? "No response generated.";

    return NextResponse.json({
      answer,
      model,
      sources: webResults,
      hasWebSearch: hasWebResults,
    });
  } catch (err: unknown) {
    console.error("[/api/search] Error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
