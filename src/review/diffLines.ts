const HUNK_HEADER = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/;

/**
 * Возвращает множество номеров строк на "новой" стороне файла (RIGHT),
 * которые реально присутствуют в unified diff patch — то есть строки,
 * на которые GitHub API разрешит оставить inline-комментарий.
 *
 * Комментарий на строку ВНЕ этого множества GitHub отклонит с 422 —
 * и что важнее, весь запрос createReview с массивом комментариев
 * упадёт целиком, даже если остальные комментарии валидны. AI может
 * галлюцинировать номер строки, поэтому валидация нужна до отправки.
 */
export function extractValidRightLines(patch: string | undefined): Set<number> {
  const validLines = new Set<number>();
  if (!patch) return validLines;

  let newLine = 0;

  for (const line of patch.split("\n")) {
    const hunkMatch = HUNK_HEADER.exec(line);
    if (hunkMatch) {
      newLine = Number(hunkMatch[1]);
      continue;
    }

    if (line.startsWith("+++") || line.startsWith("---")) continue;

    if (line.startsWith("+")) {
      validLines.add(newLine);
      newLine += 1;
    } else if (line.startsWith("-")) {
      // строка удалена — на новой стороне файла её не существует, не считаем
    } else if (line.startsWith(" ") || line === "") {
      // контекстная строка — присутствует на обеих сторонах
      validLines.add(newLine);
      newLine += 1;
    }
    // строки вида "\ No newline at end of file" — игнорируем, счётчик не двигаем
  }

  return validLines;
}
