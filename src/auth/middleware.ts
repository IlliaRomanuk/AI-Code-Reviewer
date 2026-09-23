import type { NextFunction, Request, Response } from "express";
import {
  readSessionCookie,
  SESSION_COOKIE_NAME,
  type SessionPayload,
} from "./session.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      session?: SessionPayload;
    }
  }
}

export function sessionMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const cookieValue = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
  const session = readSessionCookie(cookieValue);
  req.session = session ?? undefined;
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}
