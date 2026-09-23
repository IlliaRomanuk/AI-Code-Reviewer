import { config } from "../config/env.js";
import type { ReviewFile } from "../review/types.js";
import type { ReviewComment } from "./types.js";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt.js";
import { parseReviewResponse } from "./parseResponse.js";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MAX_TOKENS = 4096;

interface AnthropicMessageResponse {
  content: Array<{ type: string; text?: string }>;
}

async function callAnthropic(userPrompt: string): Promise<string> {
  if (!config.ai.anthropicApiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set — cannot call the AI review engine. See .env.example.",
    );
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": config.ai.anthropicApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.ai.model,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${errorBody}`);
  }

  const data = (await response.json()) as AnthropicMessageResponse;
  const textBlock = data.content.find((block) => block.type === "text");
  if (!textBlock?.text) {
    throw new Error("Anthropic API response had no text content block");
  }
  return textBlock.text;
}

/**
 * Полный цикл: distilled-файлы PR -> промпт -> вызов модели -> парсинг в
 * структурированные ReviewComment[], готовые к публикации через GitHub API.
 */
export async function generateReviewComments(
  files: ReviewFile[],
): Promise<ReviewComment[]> {
  if (files.length === 0) return [];

  const userPrompt = buildUserPrompt(files);
  const rawText = await callAnthropic(userPrompt);
  return parseReviewResponse(rawText);
}
