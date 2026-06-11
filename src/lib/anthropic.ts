// Anthropic Messages API via fetch (no SDK dependency).
// Column writing uses ANTHROPIC_MODEL (claude-fable-5; never silently substitute smaller models).
// Utility steps use ANTHROPIC_UTILITY_MODEL (configurable, logged in events).

const API = "https://api.anthropic.com/v1/messages";

export interface AnthropicResult {
  text: string;
  model: string;
  stop_reason: string;
  usage: { input_tokens: number; output_tokens: number };
}

interface CallOpts {
  system?: string;
  prompt: string;
  model?: string;
  maxTokens?: number;
  webSearch?: boolean;
  temperature?: number;
  /** Extended thinking budget in tokens (enables thinking when set). */
  thinkingBudget?: number;
}

export function columnModel(): string {
  return process.env.ANTHROPIC_MODEL || "claude-fable-5";
}
export function utilityModel(): string {
  return process.env.ANTHROPIC_UTILITY_MODEL || columnModel();
}

export async function callClaude(opts: CallOpts): Promise<AnthropicResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  const model = opts.model || columnModel();

  const body: Record<string, unknown> = {
    model,
    max_tokens: opts.maxTokens ?? 8000,
    messages: [{ role: "user", content: opts.prompt }],
  };
  if (opts.system) body.system = opts.system;
  if (opts.thinkingBudget) {
    // Extended thinking: deeper reasoning before writing. Incompatible with temperature.
    body.thinking = { type: "enabled", budget_tokens: opts.thinkingBudget };
  } else if (typeof opts.temperature === "number") {
    body.temperature = opts.temperature;
  }
  if (opts.webSearch) {
    body.tools = [{ type: "web_search_20250305", name: "web_search", max_uses: 8 }];
  }

  const res = await fetch(API, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${errText.slice(0, 500)}`);
  }

  const data = await res.json();
  const text = (data.content as Array<{ type: string; text?: string }>)
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  return {
    text,
    model: data.model,
    stop_reason: data.stop_reason,
    usage: data.usage,
  };
}

/** Extract the first ```json fenced block (or bare JSON) from model output. */
export function extractJson<T>(text: string): T {
  const fence = text.match(/```json\s*([\s\S]*?)```/);
  const raw = fence ? fence[1] : text;
  const start = raw.search(/[[{]/);
  if (start === -1) throw new Error("No JSON found in model output");
  // Trim to last closing bracket to survive trailing prose.
  const lastBrace = Math.max(raw.lastIndexOf("}"), raw.lastIndexOf("]"));
  return JSON.parse(raw.slice(start, lastBrace + 1)) as T;
}
