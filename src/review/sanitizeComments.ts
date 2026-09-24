import type { ReviewFile } from "./types.js";
import type { ReviewComment } from "../ai/types.js";
import { extractValidRightLines } from "./diffLines.js";

/**
 * Проверяет каждый комментарий от AI против того, что реально есть в diff:
 * - если filename не входит в список изменённых файлов PR — комментарий
 *   отбрасывается целиком (AI мог перепутать/выдумать путь);
 * - если line указан, но не входит в диапазон строк, реально присутствующих
 *   в патче — комментарий понижается до file-level (line убирается, тело
 *   сохраняется), а не отбрасывается — обычно он всё ещё полезен, просто
 *   GitHub не даст прикрепить его к конкретной строке.
 *
 * Без этой проверки один галлюцинированный номер строки роняет весь
 * createReview-запрос (GitHub API отклоняет ВСЕ комментарии в review,
 * если хотя бы один невалиден) — см. postComments.ts.
 */
export function sanitizeCommentsAgainstDiff(
  files: ReviewFile[],
  comments: ReviewComment[],
): ReviewComment[] {
  const validLinesByFile = new Map<string, Set<number>>();
  for (const file of files) {
    validLinesByFile.set(file.filename, extractValidRightLines(file.patch));
  }

  const result: ReviewComment[] = [];

  for (const comment of comments) {
    const validLines = validLinesByFile.get(comment.filename);

    if (!validLines) {
      console.warn(
        `[review] dropping AI comment for "${comment.filename}" — file not in this PR's diff`,
      );
      continue;
    }

    if (comment.line !== undefined && !validLines.has(comment.line)) {
      console.warn(
        `[review] AI referenced ${comment.filename}:${comment.line}, not part of the diff — ` +
          "downgrading to a file-level comment instead of dropping it",
      );
      result.push({ filename: comment.filename, body: comment.body });
      continue;
    }

    result.push(comment);
  }

  return result;
}
