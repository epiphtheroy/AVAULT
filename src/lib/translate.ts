import { callClaude, translationModel } from "./anthropic";
import { interleaveTranslationPrompt } from "./prompts";

/** EN→KO interleaved review translation on the cheap model. Returns markdown (no JSON parsing). */
export async function translateForReview(markdown: string): Promise<string> {
  const result = await callClaude({
    prompt: interleaveTranslationPrompt(markdown.slice(0, 14000)),
    model: translationModel(),
    maxTokens: 12000,
    temperature: 0,
  });
  return result.text.trim();
}
