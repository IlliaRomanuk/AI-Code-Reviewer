import express, { type Application } from "express";
import { healthRouter } from "./routes/health";

/**
 * Собирает Express-приложение без запуска listen().
 * Разделение app/server пригодится на этапе тестов (этап 8) —
 * supertest сможет импортировать app напрямую, без поднятия порта.
 */
export function createApp(): Application {
  const app = express();

  app.use(express.json());
  app.use(healthRouter);

  return app;
}
