import type { ReviewComment } from "./types.js";

/**
 * Модель иногда всё равно оборачивает JSON в ```json ... ``` несмотря на
 * инструкцию в системном промпте — снимаем обёртку перед парсингом.
 */
function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = /^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(trimmed);
  return fenceMatch ? (fenceMatch[1] ?? trimmed) : trimmed;
}

function isValidComment(value: unknown): value is ReviewComment {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  const filenameOk =
    typeof candidate.filename === "string" && candidate.filename.length > 0;
  const bodyOk = typeof candidate.body === "string" && candidate.body.length > 0;
  const lineOk = candidate.line === undefined || typeof candidate.line === "number";
  return filenameOk && bodyOk && lineOk;
}

/**
 * Парсит текстовый ответ модели в массив ReviewComment.
 * Намеренно строгий: любой элемент, не прошедший валидацию, отбрасывается,
 * а не роняет весь ревью — лучше показать 3 хороших комментария, чем 0.
 */
export function parseReviewResponse(rawText: string): ReviewComment[] {
  const jsonText = stripCodeFence(rawText);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    console.error("[ai] failed to parse model response as JSON:", jsonText.slice(0, 200));
    return [];
  }

  if (!Array.isArray(parsed)) {
    console.error("[ai] model response is not a JSON array");
    return [];
  }

  return parsed.filter(isValidComment);
}
