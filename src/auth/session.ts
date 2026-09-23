import jwt from "jsonwebtoken";
import { config } from "../config/env.js";

export interface SessionPayload {
  githubLogin: string;
  githubUserId: number;
  accessToken: string;
}

const COOKIE_NAME = "session";
const EXPIRES_IN = "7d";

export function issueSessionCookie(payload: SessionPayload): {
  name: string;
  value: string;
  options: { httpOnly: true; sameSite: "lax"; maxAge: number };
} {
  const token = jwt.sign(payload, config.session.secret, { expiresIn: EXPIRES_IN });
  return {
    name: COOKIE_NAME,
    value: token,
    options: { httpOnly: true, sameSite: "lax", maxAge: 7 * 24 * 60 * 60 * 1000 },
  };
}

export function readSessionCookie(
  cookieValue: string | undefined,
): SessionPayload | null {
  if (!cookieValue) return null;
  try {
    return jwt.verify(cookieValue, config.session.secret) as SessionPayload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
