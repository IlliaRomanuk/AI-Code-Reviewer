import type { PullRequestDiff, ReviewFile } from "./types.js";

const IGNORED_PATTERNS = [
  /package-lock\.json$/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/,
  /\.min\.(js|css)$/,
  /^dist\//,
  /^build\//,
];

const MAX_PATCH_CHARS = 4000; // защита от гигантских автогенерённых файлов в промпте

function isNoiseFile(filename: string): boolean {
  return IGNORED_PATTERNS.some((pattern) => pattern.test(filename));
}

function truncatePatch(patch: string | undefined): string | undefined {
  if (!patch) return patch;
  if (patch.length <= MAX_PATCH_CHARS) return patch;
  return `${patch.slice(0, MAX_PATCH_CHARS)}\n... [обрезано, файл слишком большой]`;
}

/**
 * Отфильтровывает lock-файлы/минифицированный код и обрезает огромные
 * патчи — то, что реально стоит показывать AI-ревьюеру, а не сырой diff.
 */
export function distillDiffForReview(diff: PullRequestDiff): ReviewFile[] {
  return diff.files
    .filter((file) => !isNoiseFile(file.filename))
    .map((file) => ({ ...file, patch: truncatePatch(file.patch) }));
}
