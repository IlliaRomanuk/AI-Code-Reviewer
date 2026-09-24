import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import {
  findOrCreateUser,
  saveReview,
  listReviewsForUser,
} from "../src/db/repository.js";
import { db } from "../src/db/client.js";
import { reviewComments } from "../src/db/schema.js";

/**
 * Эти тесты бьют по реальному PostgreSQL (DATABASE_URL), а не по моку —
 * раньше вся эта логика (findOrCreateUser/saveReview/listReviewsForUser)
 * проверялась только одноразовыми ручными скриптами при разработке и
 * никогда не запускалась в CI. Значит, сломанная миграция или опечатка в
 * схеме проходила бы CI незамеченной. Требует применённых миграций
 * (npm run db:migrate) — см. .github/workflows/ci.yml.
 *
 * Случайный githubUserId на каждый вызов — тесты не полагаются на чистую
 * БД между прогонами и не мешают друг другу при повторных локальных запусках.
 */
function randomGithubUserId(): number {
  return crypto.randomInt(1_000_000_000, 2_000_000_000);
}

describe("db/repository (real PostgreSQL)", () => {
  it("findOrCreateUser creates a new user on first call", async () => {
    const githubUserId = randomGithubUserId();
    const user = await findOrCreateUser(githubUserId, "first-time-user");

    expect(user.githubUserId).toBe(githubUserId);
    expect(user.githubLogin).toBe("first-time-user");
    expect(user.id).toBeGreaterThan(0);
  });

  it("findOrCreateUser is idempotent for the same id + login", async () => {
    const githubUserId = randomGithubUserId();
    const first = await findOrCreateUser(githubUserId, "same-login");
    const second = await findOrCreateUser(githubUserId, "same-login");

    expect(second.id).toBe(first.id);
  });

  it("findOrCreateUser updates a stale login without creating a duplicate row", async () => {
    const githubUserId = randomGithubUserId();
    const original = await findOrCreateUser(githubUserId, "old-name");
    const renamed = await findOrCreateUser(githubUserId, "new-name");

    expect(renamed.id).toBe(original.id);
    expect(renamed.githubLogin).toBe("new-name");
  });

  it("saveReview persists the review row and every comment row", async () => {
    const user = await findOrCreateUser(randomGithubUserId(), "review-author");

    const review = await saveReview({
      userId: user.id,
      repoFullName: "octo/integration-test",
      pullNumber: 99,
      comments: [
        { filename: "a.ts", line: 3, body: "first" },
        { filename: "b.ts", body: "second, file-level" },
      ],
    });

    expect(review.commentCount).toBe(2);

    const persistedComments = await db
      .select()
      .from(reviewComments)
      .where(eq(reviewComments.reviewId, review.id));

    expect(persistedComments).toHaveLength(2);
    expect(persistedComments.map((c) => c.filename).sort()).toEqual(["a.ts", "b.ts"]);
  });

  it("saveReview with zero comments still creates the review row", async () => {
    const user = await findOrCreateUser(randomGithubUserId(), "no-issues-author");
    const review = await saveReview({
      userId: user.id,
      repoFullName: "octo/clean-pr",
      pullNumber: 1,
      comments: [],
    });

    expect(review.commentCount).toBe(0);
  });

  it("listReviewsForUser returns only that user's reviews", async () => {
    const userA = await findOrCreateUser(randomGithubUserId(), "user-a");
    const userB = await findOrCreateUser(randomGithubUserId(), "user-b");

    await saveReview({
      userId: userA.id,
      repoFullName: "octo/repo-a",
      pullNumber: 1,
      comments: [],
    });
    await saveReview({
      userId: userB.id,
      repoFullName: "octo/repo-b",
      pullNumber: 1,
      comments: [],
    });

    const reviewsForA = await listReviewsForUser(userA.id);
    expect(reviewsForA).toHaveLength(1);
    expect(reviewsForA[0]?.repoFullName).toBe("octo/repo-a");
  });
});
