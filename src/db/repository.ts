import { eq } from "drizzle-orm";
import { db } from "./client.js";
import { users, reviews, reviewComments } from "./schema.js";
import type { ReviewComment } from "../ai/types.js";

export async function findOrCreateUser(githubUserId: number, githubLogin: string) {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.githubUserId, githubUserId));
  const existingUser = existing[0];

  if (existingUser) {
    // Пользователь мог переименоваться на GitHub — держим login актуальным,
    // а не замораживаем его значением на момент первого входа.
    if (existingUser.githubLogin !== githubLogin) {
      const [updated] = await db
        .update(users)
        .set({ githubLogin })
        .where(eq(users.id, existingUser.id))
        .returning();
      return updated ?? existingUser;
    }
    return existingUser;
  }

  const [created] = await db
    .insert(users)
    .values({ githubUserId, githubLogin })
    .returning();
  if (!created) throw new Error("Failed to create user row");
  return created;
}

export async function saveReview(params: {
  userId: number;
  repoFullName: string;
  pullNumber: number;
  comments: ReviewComment[];
}) {
  // Транзакция: без неё сбой второго insert (reviewComments) после
  // успешного первого (reviews) оставляет "осиротевшую" запись ревью с
  // commentCount, не совпадающим с реальным количеством сохранённых
  // комментариев — данные рассинхронизируются.
  return db.transaction(async (tx) => {
    const [review] = await tx
      .insert(reviews)
      .values({
        userId: params.userId,
        repoFullName: params.repoFullName,
        pullNumber: params.pullNumber,
        commentCount: params.comments.length,
      })
      .returning();

    if (!review) throw new Error("Failed to create review row");

    if (params.comments.length > 0) {
      await tx.insert(reviewComments).values(
        params.comments.map((c) => ({
          reviewId: review.id,
          filename: c.filename,
          line: c.line ?? null,
          body: c.body,
        })),
      );
    }

    return review;
  });
}

export async function listReviewsForUser(userId: number) {
  return db
    .select()
    .from(reviews)
    .where(eq(reviews.userId, userId))
    .orderBy(reviews.createdAt);
}
