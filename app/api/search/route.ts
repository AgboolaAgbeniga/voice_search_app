import { NextRequest, NextResponse } from "next/server";
import { getNvidiaClient, getModel } from "@/lib/nvidia-client";
import { getWebResults } from "@/lib/search-providers";

// ─── Main Route ───────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { query, model: requestedModel } = await req.json();

    if (!query?.trim()) {
      return NextResponse.json({ error: "Query is required." }, { status: 400 });
    }

    const model = getModel(requestedModel);

    // 1. Fetch web results if any keys are provided
    const webResults = await getWebResults(query);
    const hasWebResults = webResults.length > 0;

    // 2. Build prompt for direct answer
    const systemPrompt = hasWebResults
      ? `You are a helpful AI assistant. Answer the user's question clearly, concisely, and directly using the provided search results.
Provide a direct summary answer in 1-2 sentences max. Use the search results to ensure accuracy.`
      : `You are a helpful AI assistant. Answer the user's question clearly, concisely, and directly.
Provide a direct summary answer in 1-2 sentences max. Do not include any fluff or introductory phrases. Just the facts.`;

    const userContent = hasWebResults
      ? `Question: ${query}\n\nSearch Results:\n${webResults.map(r => `${r.title}: ${r.snippet}`).join("\n\n")}`
      : query;

    // 3. Call NVIDIA API
    const client = getNvidiaClient();
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
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


    // 1. Fetch web results if any keys are provided
    const webResults = await getWebResults(query);
    const hasWebResults = webResults.length > 0;

    // 2. Build prompt for direct answer
    const systemPrompt = hasWebResults
      ? `You are a helpful AI assistant. Answer the user's question clearly, concisely, and directly using the provided search results.
Provide a direct summary answer in 1-2 sentences max. Use the search results to ensure accuracy.`
      : `You are a helpful AI assistant. Answer the user's question clearly, concisely, and directly.
Provide a direct summary answer in 1-2 sentences max. Do not include any fluff or introductory phrases. Just the facts.`;

    const userContent = hasWebResults
      ? `Question: ${query}\n\nSearch Results:\n${webResults.map(r => `${r.title}: ${r.snippet}`).join("\n\n")}`
      : query;

    // 3. Call NVIDIA API
    const client = getNvidiaClient();
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
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
