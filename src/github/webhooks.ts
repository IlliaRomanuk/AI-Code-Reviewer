import { Webhooks } from "@octokit/webhooks";
import { config } from "../config/env.js";

export const webhooks = new Webhooks({
  secret: config.github.webhookSecret || "dev-placeholder-secret",
});

/**
 * Заглушка на этот этап: просто логируем событие.
 * На этапах 4–6 сюда подключится реальный пайплайн:
 * fetchDiff -> AI review -> postComments -> persist to DB.
 */
webhooks.on(
  ["pull_request.opened", "pull_request.synchronize"],
  ({ id, name, payload }) => {
    console.log(
      `[webhook] ${name} (${id}) — PR #${payload.pull_request.number} in ${payload.repository.full_name}`,
    );
  },
);

webhooks.onError((error) => {
  console.error(
    `[webhook] error handling ${error.event?.name ?? "unknown"} event:`,
    error.message,
  );
});
