import express, { type Application } from "express";
import cookieParser from "cookie-parser";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { sessionMiddleware } from "./auth/middleware.js";

/**
 * Собирает Express-приложение без запуска listen().
 * Разделение app/server пригодится на этапе тестов (этап 8) —
 * supertest сможет импортировать app напрямую, без поднятия порта.
 */
export function createApp(): Application {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());
  app.use(sessionMiddleware);

  app.use(healthRouter);
  app.use(authRouter);

  return app;
}
