import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

describe("unknown routes", () => {
  it("returns JSON 404 for a path that doesn't exist", async () => {
    const app = createApp();
    const res = await request(app).get("/this/route/does/not/exist");

    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body).toEqual({ error: "Not found" });
  });
});
