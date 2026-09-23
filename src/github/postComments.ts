import type { Octokit } from "@octokit/rest";
import type { ReviewComment } from "../ai/types.js";

/**
 * Публикует один GitHub Review с несколькими inline-комментариями за раз
 * (createReview), а не отдельный API-запрос на каждый комментарий —
 * меньше нагрузки на rate limit и один аккуратный review в UI PR'а.
 * Комментарии без line публикуются как summary-body ревью.
 */
export async function postReviewComments(
  octokit: Octokit,
  params: { owner: string; repo: string; pullNumber: number },
  comments: ReviewComment[],
): Promise<void> {
  if (comments.length === 0) return;

  const inline = comments.filter(
    (c): c is ReviewComment & { line: number } => c.line !== undefined,
  );
  const fileLevel = comments.filter((c) => c.line === undefined);

  const summaryBody =
    fileLevel.length > 0
      ? `**AI Code Review** — общие замечания:\n\n${fileLevel
          .map((c) => `- \`${c.filename}\`: ${c.body}`)
          .join("\n")}`
      : "**AI Code Review**";

  await octokit.rest.pulls.createReview({
    owner: params.owner,
    repo: params.repo,
    pull_number: params.pullNumber,
    event: "COMMENT",
    body: summaryBody,
    comments: inline.map((c) => ({
      path: c.filename,
      line: c.line,
      body: c.body,
    })),
  });
}
