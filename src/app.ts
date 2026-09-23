import express, { type Application } from "express";
import cookieParser from "cookie-parser";
import { createNodeMiddleware } from "@octokit/webhooks";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { sessionMiddleware } from "./auth/middleware.js";
import { webhooks } from "./github/webhooks.js";

const WEBHOOK_PATH = "/webhooks/github";

/**
 * Собирает Express-приложение без запуска listen().
 * Разделение app/server пригодится на этапе тестов (этап 8) —
 * supertest сможет импортировать app напрямую, без поднятия порта.
 */
export function createApp(): Application {
  const app = express();

  // Должен стоять ДО express.json(): @octokit/webhooks сам читает raw body,
  // чтобы проверить HMAC-подпись запроса (X-Hub-Signature-256).
  app.use(createNodeMiddleware(webhooks, { path: WEBHOOK_PATH }));

  app.use(express.json());
  app.use(cookieParser());
  app.use(sessionMiddleware);

  app.use(healthRouter);
  app.use(authRouter);

  return app;
}
