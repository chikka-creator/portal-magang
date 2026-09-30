const BASE_URL = (process.env.AI_BASE_URL || "").replace(/\/+$/, "");
const API_KEY = process.env.AI_API_KEY || "";
const MODEL = process.env.AI_MODEL || "kerehore";
const TIMEOUT_MS = 12000;

/**
 * Call the OpenAI-compatible chat endpoint. Returns null on any failure
 * (missing config, timeout, HTTP error) so callers can fall back to
 * keyword-based search.
 */
export async function askLima(
  system: string,
  user: string,
  maxTokens = 700
): Promise<string | null> {
  if (!BASE_URL || !API_KEY) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`askLima: HTTP ${res.status}`);
      return null;
    }
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    return typeof content === "string" && content.trim() ? content : null;
  } catch (err) {
    console.error("askLima:", err instanceof Error ? err.message : err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Extract a JSON object from model output (handles ```json fences and prose). */
export function parseJsonObject(text: string): Record<string, unknown> | null {
  const cleaned = text.replace(/```[a-z]*/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}
