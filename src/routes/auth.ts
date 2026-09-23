import { Router, type Request, type Response } from "express";
import { Octokit } from "@octokit/rest";
import { oauthApp } from "../github/oauthApp.js";
import { config } from "../config/env.js";
import { issueSessionCookie } from "../auth/session.js";

export const authRouter = Router();

/**
 * GET /auth/github/login
 * Редиректит пользователя на страницу авторизации GitHub.
 */
authRouter.get("/auth/github/login", (_req: Request, res: Response) => {
  const { url } = oauthApp.getWebFlowAuthorizationUrl({});
  res.redirect(url);
});

/**
 * GET /auth/github/callback
 * GitHub возвращает сюда с ?code=... — обмениваем код на access token,
 * узнаём пользователя и выдаём собственную session-cookie.
 */
authRouter.get("/auth/github/callback", async (req: Request, res: Response) => {
  const code = req.query.code;
  if (typeof code !== "string") {
    res.status(400).json({ error: "Missing OAuth code" });
    return;
  }

  try {
    const { authentication } = await oauthApp.createToken({ code });
    const octokit = new Octokit({ auth: authentication.token });
    const { data: user } = await octokit.rest.users.getAuthenticated();

    const cookie = issueSessionCookie({
      githubLogin: user.login,
      githubUserId: user.id,
      accessToken: authentication.token,
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
