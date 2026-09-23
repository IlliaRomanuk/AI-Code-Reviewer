/**
 * Централизованное чтение переменных окружения.
 * На следующих этапах сюда добавятся GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY,
 * GITHUB_WEBHOOK_SECRET, AI_API_KEY, DATABASE_URL и т.д.
 */

export interface AppConfig {
  port: number;
  nodeEnv: "development" | "production" | "test";
}

function readConfig(): AppConfig {
  const port = Number(process.env.PORT ?? 3000);
  const nodeEnv = (process.env.NODE_ENV as AppConfig["nodeEnv"]) ?? "development";

  return { port, nodeEnv };
}

export const config = readConfig();
