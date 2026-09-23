import { pgTable, serial, integer, text, varchar, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  githubUserId: integer("github_user_id").notNull().unique(),
  githubLogin: varchar("github_login", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  repoFullName: varchar("repo_full_name", { length: 255 }).notNull(),
  pullNumber: integer("pull_number").notNull(),
  commentCount: integer("comment_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviewComments = pgTable("review_comments", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id")
    .references(() => reviews.id)
    .notNull(),
  filename: varchar("filename", { length: 1024 }).notNull(),
  line: integer("line"),
  body: text("body").notNull(),
});
