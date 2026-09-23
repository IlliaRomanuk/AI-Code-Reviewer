import { Router, type Request, type Response } from "express";

export const healthRouter = Router();

/**
 * GET /health
 * Простой health-check: подтверждает, что сервис запущен и отвечает.
 * Пригодится для CI/CD (этап 8) и мониторинга после деплоя.
 */
healthRouter.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    uptimeSeconds: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});
