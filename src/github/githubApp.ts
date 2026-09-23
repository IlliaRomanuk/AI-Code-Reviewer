import { App } from "@octokit/app";
import { config } from "../config/env.js";

/**
 * GitHub App-аутентификация: используется для webhooks (этап 3),
 * чтения diff (этап 4) и публикации review-комментариев (этап 6)
 * от имени приложения, а не конкретного пользователя.
 */
export const githubApp = new App({
  appId: config.github.appId,
  privateKey: config.github.privateKey,
  webhooks: {
    secret: config.github.webhookSecret,
  },
});

/**
 * Возвращает Octokit, авторизованный как конкретная installation
 * (т.е. как приложение внутри одного репозитория/организации).
 */
export async function getInstallationOctokit(installationId: number) {
  return githubApp.getInstallationOctokit(installationId);
}
