import OpenAI from "openai";

// ─── NVIDIA AI Client ─────────────────────────────────────────────────────────

export function getNvidiaClient() {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new Error("NVIDIA_API_KEY is not set in environment variables.");

  return new OpenAI({
    apiKey,
    baseURL: "https://integrate.api.nvidia.com/v1",
  });
}

export function getModel(): string {
  return process.env.NVIDIA_MODEL ?? "deepseek-ai/deepseek-r1";
}
