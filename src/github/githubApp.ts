import { App } from "@octokit/app";
import { config } from "../config/env.js";

/**
 * GitHub App-аутентификация: используется для чтения diff (этап 4) и
 * публикации review-комментариев (этап 6) от имени приложения, а не
 * конкретного пользователя.
 *
 * Инициализация ЛЕНИВАЯ и намеренно: @octokit/app бросает исключение,
 * если appId/privateKey не заданы, а это нормальная ситуация до тех
 * пор, пока разработчик не зарегистрировал своё GitHub App — сервер
 * (health-check, дашборд, auth) должен запускаться и без них.
 */
let cachedApp: App | undefined;

function getGithubApp(): App {
  if (!config.github.appId || !config.github.privateKey) {
    throw new Error(
      "GITHUB_APP_ID / GITHUB_APP_PRIVATE_KEY не заданы в .env — GitHub App функциональность " +
        "(diff, публикация ревью) недоступна, пока не зарегистрируешь приложение на " +
        "https://github.com/settings/apps/new",
    );
  }

  cachedApp ??= new App({
    appId: config.github.appId,
    privateKey: config.github.privateKey,
  });
  return cachedApp;
}

/**
 * Возвращает Octokit, авторизованный как конкретная installation
 * (т.е. как приложение внутри одного репозитория/организации).
 */
export async function getInstallationOctokit(installationId: number) {
  return getGithubApp().getInstallationOctokit(installationId);
}
