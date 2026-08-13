import OpenAI from "openai";

// ─── NVIDIA AI Client ─────────────────────────────────────────────────────────

export const NVIDIA_MODELS = [
  { id: "meta/llama-3.3-70b-instruct", label: "Llama 3.3 70B" },
  { id: "meta/muse-glimmer-30b", label: "Muse Glimmer 30B" },
] as const;

export type NvidiaModelId = (typeof NVIDIA_MODELS)[number]["id"];

export function getNvidiaClient() {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new Error("NVIDIA_API_KEY is not set in environment variables.");

  return new OpenAI({
    apiKey,
    baseURL: "https://integrate.api.nvidia.com/v1",
  });
}

export function getModel(override?: string): string {
  return override ?? "meta/llama-3.3-70b-instruct";
}
