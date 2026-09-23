import type { Octokit } from "@octokit/rest";
import { fetchPullRequestDiff } from "../github/diff.js";
import { distillDiffForReview } from "./parseDiff.js";
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
  const comments = await generateReviewComments(files);

  console.log(`[review] ${label} — posting ${comments.length} comment(s) to GitHub`);
  await postReviewComments(octokit, { owner, repo, pullNumber }, comments);

  console.log(`[review] ${label} — persisting review history`);
  const user = await findOrCreateUser(params.prAuthorGithubId, params.prAuthorLogin);
  await saveReview({
    userId: user.id,
    repoFullName: `${owner}/${repo}`,
    pullNumber,
    comments,
  });

  console.log(`[review] ${label} — done`);
}
