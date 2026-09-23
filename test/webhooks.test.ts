import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import request from "supertest";
import { createApp } from "../src/app.js";

const SECRET = process.env.GITHUB_WEBHOOK_SECRET || "dev-placeholder-secret";

function sign(payload: string): string {
  return `sha256=${crypto.createHmac("sha256", SECRET).update(payload).digest("hex")}`;
}

describe("POST /webhooks/github", () => {
  const payload = JSON.stringify({
    action: "opened",
    number: 1,
    pull_request: { number: 1, user: { id: 1, login: "someone" } },
    repository: { full_name: "octo/demo", name: "demo", owner: { login: "octo" } },
  });

  it("accepts a request with a valid HMAC signature", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/webhooks/github")
      .set("Content-Type", "application/json")
      .set("X-GitHub-Event", "pull_request")
      .set("X-GitHub-Delivery", "test-delivery-valid")
      .set("X-Hub-Signature-256", sign(payload))
      .send(payload);

    expect(res.status).toBe(200);
  });

  it("rejects a request with an invalid HMAC signature", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/webhooks/github")
      .set("Content-Type", "application/json")
      .set("X-GitHub-Event", "pull_request")
      .set("X-GitHub-Delivery", "test-delivery-invalid")
      .set("X-Hub-Signature-256", "sha256=deadbeef")
      .send(payload);

    expect(res.status).toBe(400);
  });
});
