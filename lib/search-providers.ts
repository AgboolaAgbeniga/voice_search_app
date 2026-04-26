import { SearchResult } from "@/types";

// ─── Web Search Helpers ───────────────────────────────────────────────────────

export async function searchBrave(query: string): Promise<SearchResult[]> {
  const key = process.env.BRAVE_SEARCH_API_KEY;
  if (!key) return [];

  const res = await fetch(
    `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,
    { headers: { "X-Subscription-Token": key, Accept: "application/json" } }
  );
  if (!res.ok) return [];

  const data = await res.json();
  return (data.web?.results ?? []).slice(0, 5).map((r: { title: string; url: string; description: string }) => ({
    title: r.title,
    url: r.url,
    snippet: r.description,
  }));
}

export async function searchSerper(query: string): Promise<SearchResult[]> {
  const key = process.env.SERPER_API_KEY;
  if (!key) return [];

  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": key, "Content-Type": "application/json" },
    body: JSON.stringify({ q: query, num: 5 }),
  });
  if (!res.ok) return [];

  const data = await res.json();
  const results: SearchResult[] = [];
  if (data.answerBox) {
    results.push({
      title: "Answer Box",
      url: data.answerBox.link ?? "",
      snippet: data.answerBox.answer ?? data.answerBox.snippet ?? "",
    });
  }
  (data.organic ?? []).slice(0, 4).forEach((r: { title: string; link: string; snippet: string }) => {
    results.push({ title: r.title, url: r.link, snippet: r.snippet });
  });
  return results;
}

export async function searchTavily(query: string): Promise<SearchResult[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return [];

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: key, query, search_depth: "basic", max_results: 5 }),
  });
  if (!res.ok) return [];

  const data = await res.json();
  return (data.results ?? []).slice(0, 5).map((r: { title: string; url: string; content: string }) => ({
    title: r.title,
    url: r.url,
    snippet: r.content,
  }));
}

export async function getWebResults(query: string): Promise<SearchResult[]> {
  // Try each provider in order of preference
  if (process.env.TAVILY_API_KEY) return searchTavily(query);
  if (process.env.BRAVE_SEARCH_API_KEY) return searchBrave(query);
  if (process.env.SERPER_API_KEY) return searchSerper(query);
  return []; // No search key — AI answers from training data only
}
