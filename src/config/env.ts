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
  database: {
    url: string;
  };
}

function readConfig(): AppConfig {
  const port = Number(process.env.PORT ?? 3000);
  const nodeEnv = (process.env.NODE_ENV as AppConfig["nodeEnv"]) ?? "development";

  const sessionSecret = process.env.SESSION_SECRET ?? "dev-insecure-secret-change-me";
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET ?? "";

  if (nodeEnv === "production") {
    const problems: string[] = [];
    if (
      !process.env.SESSION_SECRET ||
      sessionSecret === "dev-insecure-secret-change-me"
    ) {
      problems.push("SESSION_SECRET is missing or still set to its insecure dev default");
    }
    if (!webhookSecret) {
      problems.push(
        "GITHUB_WEBHOOK_SECRET is missing — webhook signature checks are unsafe",
      );
    }
    if (problems.length > 0) {
      throw new Error(
        `Refusing to start in production with insecure config:\n- ${problems.join("\n- ")}\n` +
          "Set these in your environment (or .env) before starting the server.",
      );
    }
  }

  return {
    port,
    nodeEnv,
    frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
    session: {
      secret: sessionSecret,
    },
    github: {
      appId: process.env.GITHUB_APP_ID ?? "",
      // .env stores the PEM with literal \n — convert back to real newlines
      privateKey: (process.env.GITHUB_APP_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
      webhookSecret,
      clientId: process.env.GITHUB_APP_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_APP_CLIENT_SECRET ?? "",
    },
    ai: {
      anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
      model: process.env.AI_MODEL ?? "claude-sonnet-4-6",
    },
    database: {
      url:
        process.env.DATABASE_URL ??
        "postgresql://postgres:devpassword@localhost:5432/ai_code_review",
    },
  };
}

export const config = readConfig();
