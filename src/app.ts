import express, {
  type Application,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { createNodeMiddleware } from "@octokit/webhooks";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { apiRouter } from "./routes/api.js";
import { sessionMiddleware } from "./auth/middleware.js";
import { webhooks } from "./github/webhooks.js";
import { config } from "./config/env.js";

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

  app.use(cors({ origin: config.frontendUrl, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(sessionMiddleware);

  app.use(healthRouter);
  app.use(authRouter);
  app.use(apiRouter);

  // Неизвестный путь -> JSON 404, а не HTML-страница Express по умолчанию.
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "Not found" });
  });

  // Глобальный обработчик ошибок — ловит и синхронные throw, и отклонённые
  // промисы из async-роутов (Express 5 сам форвардит их сюда). Без него
  // любая необработанная ошибка (например, обрыв связи с БД) улетает в
  // дефолтный HTML-хендлер Express, а это REST API — клиент (дашборд)
  // везде ждёт JSON.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[app] unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
