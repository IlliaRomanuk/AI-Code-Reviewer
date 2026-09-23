/**
 * Централизованное чтение переменных окружения.
 * На следующих этапах сюда добавятся GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY,
 * GITHUB_WEBHOOK_SECRET, AI_API_KEY, DATABASE_URL и т.д.
 */

export interface AppConfig {
  port: number;
  nodeEnv: "development" | "production" | "test";
  frontendUrl: string;
  session: {
    secret: string;
  };
  github: {
    appId: string;
    privateKey: string;
    webhookSecret: string;
    clientId: string;
    clientSecret: string;
  };
  ai: {
    anthropicApiKey: string;
    model: string;
  };
}

function readConfig(): AppConfig {
  const port = Number(process.env.PORT ?? 3000);
  const nodeEnv = (process.env.NODE_ENV as AppConfig["nodeEnv"]) ?? "development";

  return {
    port,
    nodeEnv,
    frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
    session: {
      secret: process.env.SESSION_SECRET ?? "dev-insecure-secret-change-me",
    },
    github: {
      appId: process.env.GITHUB_APP_ID ?? "",
      // .env stores the PEM with literal \n — convert back to real newlines
      privateKey: (process.env.GITHUB_APP_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
      webhookSecret: process.env.GITHUB_WEBHOOK_SECRET ?? "",
      clientId: process.env.GITHUB_APP_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_APP_CLIENT_SECRET ?? "",
    },
    ai: {
      anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
      model: process.env.AI_MODEL ?? "claude-sonnet-4-6",
    },
  };
}

export const config = readConfig();
