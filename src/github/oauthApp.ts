import { OAuthApp } from "@octokit/oauth-app";
import { config } from "../config/env.js";

/**
 * Отвечает за пользовательский вход через GitHub (Web Application Flow).
 * Отдельно от GitHub App (см. githubApp.ts), которое действует от имени
 * приложения на конкретных установленных репозиториях.
 */
export const oauthApp = new OAuthApp({
  clientType: "github-app",
  clientId: config.github.clientId,
  clientSecret: config.github.clientSecret,
});
