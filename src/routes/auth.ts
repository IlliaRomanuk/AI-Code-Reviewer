import crypto from "node:crypto";
import { Router, type Request, type Response } from "express";
import { Octokit } from "@octokit/rest";
import { oauthApp } from "../github/oauthApp.js";
import { config } from "../config/env.js";
import { issueSessionCookie } from "../auth/session.js";

export const authRouter = Router();

const STATE_COOKIE_NAME = "oauth_state";
const STATE_COOKIE_MAX_AGE_MS = 10 * 60 * 1000; // 10 минут — время жизни OAuth-редиректа

/**
 * GET /auth/github/login
 * Редиректит пользователя на страницу авторизации GitHub.
 *
 * state — случайное значение, которое GitHub вернёт обратно в callback
 * без изменений. Кладём его в httpOnly cookie и сверяем в callback —
 * это защита от CSRF-атаки на OAuth-флоу (когда атакующий подсовывает
 * жертве чужой authorization code через фальшивую ссылку).
 */
authRouter.get("/auth/github/login", (_req: Request, res: Response) => {
  const state = crypto.randomBytes(16).toString("hex");

  res.cookie(STATE_COOKIE_NAME, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.nodeEnv === "production",
    maxAge: STATE_COOKIE_MAX_AGE_MS,
  });

  const { url } = oauthApp.getWebFlowAuthorizationUrl({ state });
  res.redirect(url);
});

/**
 * GET /auth/github/callback
 * GitHub возвращает сюда с ?code=...&state=... — сверяем state с тем,
 * что выдали на шаге login, обмениваем код на access token, узнаём
 * пользователя и выдаём собственную session-cookie.
 */
authRouter.get("/auth/github/callback", async (req: Request, res: Response) => {
  const code = req.query.code;
  const returnedState = req.query.state;
  const expectedState = (req.cookies as Record<string, string | undefined> | undefined)?.[
    STATE_COOKIE_NAME
  ];

  res.clearCookie(STATE_COOKIE_NAME);

  if (typeof code !== "string") {
    res.status(400).json({ error: "Missing OAuth code" });
    return;
  }

  if (
    !expectedState ||
    typeof returnedState !== "string" ||
    returnedState !== expectedState
  ) {
    console.warn(
      "[auth] OAuth state mismatch — possible CSRF attempt or expired session",
    );
    res.status(400).json({ error: "Invalid or expired OAuth state" });
    return;
  }

  try {
    const { authentication } = await oauthApp.createToken({ code });
    const octokit = new Octokit({ auth: authentication.token });
    const { data: user } = await octokit.rest.users.getAuthenticated();

    const cookie = issueSessionCookie({
      githubLogin: user.login,
      githubUserId: user.id,
    });
    res.cookie(cookie.name, cookie.value, cookie.options);
    res.redirect(config.frontendUrl);
  } catch (err) {
    console.error("[auth] OAuth callback failed:", err);
    res.status(502).json({ error: "GitHub OAuth exchange failed" });
  }
});

authRouter.post("/auth/logout", (_req: Request, res: Response) => {
  res.clearCookie("session");
  res.status(204).send();
});
