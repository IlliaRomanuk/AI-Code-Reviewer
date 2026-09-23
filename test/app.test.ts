import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

describe("GET /health", () => {
  it("returns status ok with an uptime and timestamp", async () => {
    const app = createApp();
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(typeof res.body.uptimeSeconds).toBe("number");
    expect(typeof res.body.timestamp).toBe("string");
  });
});

describe("GET /api/reviews", () => {
  it("returns 401 without a session cookie", async () => {
    const app = createApp();
    const res = await request(app).get("/api/reviews");
    expect(res.status).toBe(401);
  });
});
