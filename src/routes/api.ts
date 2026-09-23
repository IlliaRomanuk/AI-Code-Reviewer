import { Router, type Request, type Response } from "express";
import { requireAuth } from "../auth/middleware.js";
import { listReviewsForUser, findOrCreateUser } from "../db/repository.js";

export const apiRouter = Router();

apiRouter.get("/api/me", requireAuth, (req: Request, res: Response) => {
  res.json({ login: req.session?.githubLogin });
});

apiRouter.get("/api/reviews", requireAuth, async (req: Request, res: Response) => {
  const session = req.session;
  if (!session) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const user = await findOrCreateUser(session.githubUserId, session.githubLogin);
  const reviews = await listReviewsForUser(user.id);
  res.json({ reviews });
});
