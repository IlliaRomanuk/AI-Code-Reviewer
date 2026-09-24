import { describe, it, expect } from "vitest";
import { sanitizeCommentsAgainstDiff } from "../src/review/sanitizeComments.js";
import type { ReviewFile } from "../src/review/types.js";

const files: ReviewFile[] = [
  {
    filename: "src/app.ts",
    status: "modified",
    additions: 1,
    deletions: 0,
    patch: ["@@ -10,2 +10,3 @@", " context", "+added line", " more context"].join("\n"),
  },
];

describe("sanitizeCommentsAgainstDiff", () => {
  it("keeps a comment whose line is a real line in the diff", () => {
    const result = sanitizeCommentsAgainstDiff(files, [
      { filename: "src/app.ts", line: 11, body: "valid" },
    ]);
    expect(result).toEqual([{ filename: "src/app.ts", line: 11, body: "valid" }]);
  });

  it("keeps a file-level comment (no line) untouched", () => {
    const result = sanitizeCommentsAgainstDiff(files, [
      { filename: "src/app.ts", body: "file-level" },
    ]);
    expect(result).toEqual([{ filename: "src/app.ts", body: "file-level" }]);
  });

  it("downgrades a comment with a hallucinated line number to file-level instead of dropping it", () => {
    const result = sanitizeCommentsAgainstDiff(files, [
      { filename: "src/app.ts", line: 9999, body: "hallucinated line" },
    ]);
    expect(result).toEqual([{ filename: "src/app.ts", body: "hallucinated line" }]);
  });

  it("drops a comment entirely for a file not present in the diff", () => {
    const result = sanitizeCommentsAgainstDiff(files, [
      { filename: "src/does-not-exist.ts", line: 1, body: "hallucinated file" },
    ]);
    expect(result).toEqual([]);
  });

  it("processes a mixed batch correctly, keeping order otherwise stable", () => {
    const result = sanitizeCommentsAgainstDiff(files, [
      { filename: "src/app.ts", line: 11, body: "valid" },
      { filename: "ghost.ts", line: 1, body: "dropped" },
      { filename: "src/app.ts", line: 500, body: "downgraded" },
    ]);
    expect(result).toEqual([
      { filename: "src/app.ts", line: 11, body: "valid" },
      { filename: "src/app.ts", body: "downgraded" },
    ]);
  });
});
