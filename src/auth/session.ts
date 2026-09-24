import jwt from "jsonwebtoken";
import { config } from "../config/env.js";

export interface SessionPayload {
  githubLogin: string;
  githubUserId: number;
}

const COOKIE_NAME = "session";
const EXPIRES_IN = "7d";
const JWT_ALGORITHM = "HS256";

export function issueSessionCookie(payload: SessionPayload): {
  name: string;
  value: string;
  options: { httpOnly: true; sameSite: "lax"; secure: boolean; maxAge: number };
} {
  const token = jwt.sign(payload, config.session.secret, {
    expiresIn: EXPIRES_IN,
    algorithm: JWT_ALGORITHM,
  });
  return {
    name: COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      sameSite: "lax",
      secure: config.nodeEnv === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  };
}

export function readSessionCookie(
  cookieValue: string | undefined,
): SessionPayload | null {
  if (!cookieValue) return null;
  try {
    return jwt.verify(cookieValue, config.session.secret, {
      algorithms: [JWT_ALGORITHM],
    }) as SessionPayload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
