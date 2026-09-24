import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

describe("GET /auth/github/login", () => {
  it("redirects to GitHub and sets an oauth_state cookie", async () => {
    const app = createApp();
    const res = await request(app).get("/auth/github/login");

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain("github.com");

    const cookies = res.headers["set-cookie"];
    const cookieHeader = Array.isArray(cookies) ? cookies.join(";") : (cookies ?? "");
    expect(cookieHeader).toContain("oauth_state=");
    expect(cookieHeader.toLowerCase()).toContain("httponly");
  });
});

describe("GET /auth/github/callback", () => {
  it("rejects when there is no oauth_state cookie at all", async () => {
    const app = createApp();
    const res = await request(app).get("/auth/github/callback?code=abc&state=whatever");
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/state/i);
  });

  it("rejects when the state cookie doesn't match the query param (CSRF attempt)", async () => {
    const app = createApp();
    const res = await request(app)
      .get("/auth/github/callback?code=abc&state=attacker-supplied")
      .set("Cookie", "oauth_state=real-value-from-login-step");

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/state/i);
  });

  it("rejects when code is missing, even with a matching state", async () => {
    const app = createApp();
    const res = await request(app)
      .get("/auth/github/callback?state=matching")
      .set("Cookie", "oauth_state=matching");

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/code/i);
  });
});
