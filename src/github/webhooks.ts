import { Webhooks } from "@octokit/webhooks";
import type { Octokit } from "@octokit/rest";
import { config } from "../config/env.js";
import { getInstallationOctokit } from "./githubApp.js";
import { runReviewPipeline } from "../review/pipeline.js";

export const webhooks = new Webhooks({
  secret: config.github.webhookSecret || "dev-placeholder-secret",
});

webhooks.on(
  ["pull_request.opened", "pull_request.synchronize"],
  async ({ id, name, payload }) => {
    const { pull_request: pr, repository, installation } = payload;
    console.log(
      `[webhook] ${name} (${id}) — PR #${pr.number} in ${repository.full_name}`,
    );

    if (!installation) {
      console.warn(
        `[webhook] ${id} — no installation on payload, skipping review pipeline`,
      );
      return;
    }
    if (!pr.user) {
      console.warn(
        `[webhook] ${id} — PR has no user (ghost account?), skipping review pipeline`,
      );
      return;
    }

    try {
      const octokit = (await getInstallationOctokit(
        installation.id,
      )) as unknown as Octokit;
      await runReviewPipeline({
        octokit,
        owner: repository.owner.login,
        repo: repository.name,
        pullNumber: pr.number,
        prAuthorGithubId: pr.user.id,
        prAuthorLogin: pr.user.login,
      });
    } catch (err) {
      console.error(`[webhook] ${id} — review pipeline failed:`, err);
    }
  },
);

webhooks.onError((error) => {
  console.error(
    `[webhook] error handling ${error.event?.name ?? "unknown"} event:`,
    error.message,
  );
});
