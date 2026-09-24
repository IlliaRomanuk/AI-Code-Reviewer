import type { Octokit } from "@octokit/rest";
import { fetchPullRequestDiff } from "../github/diff.js";
import { distillDiffForReview } from "./parseDiff.js";
import { sanitizeCommentsAgainstDiff } from "./sanitizeComments.js";
import { generateReviewComments } from "../ai/reviewEngine.js";
import { postReviewComments } from "../github/postComments.js";
import { findOrCreateUser, saveReview } from "../db/repository.js";

export interface RunReviewParams {
  octokit: Octokit;
  owner: string;
  repo: string;
  pullNumber: number;
  /** Автор PR — на кого записывается история ревью. */
  prAuthorGithubId: number;
  prAuthorLogin: string;
}

/**
 * Полный цикл ревью одного PR. Каждый шаг логируется отдельно, чтобы в
 * проде было видно, на каком этапе пайплайн упал (diff/AI/GitHub/DB).
 */
export async function runReviewPipeline(params: RunReviewParams): Promise<void> {
  const { octokit, owner, repo, pullNumber } = params;
  const label = `${owner}/${repo}#${pullNumber}`;

  console.log(`[review] ${label} — fetching diff`);
  const diff = await fetchPullRequestDiff(octokit, owner, repo, pullNumber);
  const files = distillDiffForReview(diff);

  if (files.length === 0) {
    console.log(`[review] ${label} — nothing to review after filtering, skipping`);
    return;
  }

  console.log(`[review] ${label} — running AI review on ${files.length} file(s)`);
  const rawComments = await generateReviewComments(files);

  // AI иногда "галлюцинирует" номер строки или имя файла, которого нет в
  // diff — без этой проверки один невалидный комментарий уронит ВЕСЬ
  // запрос createReview на GitHub (см. postComments.ts).
  const comments = sanitizeCommentsAgainstDiff(files, rawComments);
  if (comments.length !== rawComments.length) {
    console.warn(
      `[review] ${label} — sanitized ${rawComments.length} -> ${comments.length} comment(s)`,
    );
  }

  console.log(`[review] ${label} — posting ${comments.length} comment(s) to GitHub`);
  let postedToGithub = true;
  try {
    await postReviewComments(octokit, { owner, repo, pullNumber }, comments);
  } catch (err) {
    // Публикация в GitHub может упасть (rate limit, права доступа, сетевой
    // сбой) — это не повод терять уже посчитанный AI-результат. Сохраняем
    // его в истории в любом случае и явно логируем частичный успех.
    postedToGithub = false;
    console.error(`[review] ${label} — failed to post comments to GitHub:`, err);
  }

  console.log(`[review] ${label} — persisting review history`);
  const user = await findOrCreateUser(params.prAuthorGithubId, params.prAuthorLogin);
  await saveReview({
    userId: user.id,
    repoFullName: `${owner}/${repo}`,
    pullNumber,
    comments,
  });

  console.log(
    `[review] ${label} — done${postedToGithub ? "" : " (comments saved, but NOT posted to GitHub — see error above)"}`,
  );
}
