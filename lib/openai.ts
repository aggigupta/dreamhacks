/**
 * ShopSense AI — OpenAI integration
 * =================================
 *
 * Philosophy:
 *
 *   - The deterministic engine is the product. The LLM is a thin polish layer.
 *   - Every call is wrapped; any failure (no key, timeout, bad JSON, garbage id)
 *     returns null / "" and the caller uses its deterministic result unchanged.
 *   - Works fully offline: with no OPENAI_API_KEY the client is null and
 *     `aiLive()` is false.
 *
 * Provider-agnostic: set OPENAI_BASE_URL to any OpenAI-compatible /v1 host
 * (Groq, Together, OpenRouter, Ollama, vLLM...) and nothing else changes.
 */
import OpenAI from "openai";

export const MODEL = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

const apiKey = process.env.OPENAI_API_KEY?.trim() || "";
const baseURL = process.env.OPENAI_BASE_URL?.trim() || undefined;
const timeout = Number(process.env.OPENAI_TIMEOUT || "8") * 1000;

/**
 * A local SLM ignores the key but the SDK still refuses to construct without a
 * non-empty string — so a base URL alone is enough to go live.
 */
export const openai: OpenAI | null =
  apiKey || baseURL
    ? new OpenAI({ apiKey: apiKey || "not-needed", baseURL, timeout, maxRetries: 1 })
    : null;

export function aiLive(): boolean {
  return openai !== null;
}

/**
 * Parse a JSON object out of an LLM reply. gpt-4o-mini in JSON mode returns a
 * bare object every time; smaller models wrap it in ```json fences or prefix
 * prose. Salvage the outermost {...} span rather than lose the call. Returns {}
 * when nothing is parseable — every caller treats that as "use the fallback".
 */
export function extractJson(content: string | null | undefined): Record<string, unknown> {
  const text = (content || "").trim();
  if (!text) return {};
  try {
    const data = JSON.parse(text);
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  } catch {
    /* fall through to span slicing */
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return {};
  try {
    const data = JSON.parse(text.slice(start, end + 1));
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  } catch {
    return {};
  }
}

/**
 * Tidy a one-line copy reply so a weaker model can't put junk on the page:
 * drop ``` fences, a leading "Sure! Here's one:" preamble, and wrapping quotes.
 * Returns "" when nothing usable is left (caller falls back to no note).
 */
export function cleanSentence(content: string | null | undefined): string {
  let text = (content || "").trim();
  if (!text) return "";
  let lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("```"));
  if (lines.length > 1 && lines[0].endsWith(":")) lines = lines.slice(1);
  text = (lines[0] || "").trim();
  if (text.startsWith("{")) {
    const obj = extractJson(text);
    text =
      Object.values(obj).find((v): v is string => typeof v === "string" && v.trim() !== "") || "";
  }
  text = text.replace(/^["']|["']$/g, "").trim();
  return text.length > 0 && text.length <= 400 ? text : "";
}
