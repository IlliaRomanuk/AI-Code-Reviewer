import { describe, it, expect } from "vitest";
import { distillDiffForReview } from "../src/review/parseDiff.js";
import type { PullRequestDiff } from "../src/review/types.js";

function makeDiff(files: PullRequestDiff["files"]): PullRequestDiff {
  return { owner: "octo", repo: "demo", pullNumber: 1, files };
}

describe("distillDiffForReview", () => {
  it("filters out lock files and minified/dist output", () => {
    const diff = makeDiff([
      {
        filename: "src/app.ts",
        status: "modified",
        additions: 1,
        deletions: 0,
        patch: "x",
      },
      {
        filename: "package-lock.json",
        status: "modified",
        additions: 200,
        deletions: 200,
      },
      { filename: "dist/bundle.min.js", status: "modified", additions: 1, deletions: 1 },
    ]);

    const result = distillDiffForReview(diff);
    expect(result.map((f) => f.filename)).toEqual(["src/app.ts"]);
  });

  it("truncates patches over 4000 chars and appends a marker", () => {
    const hugePatch = "x".repeat(5000);
    const diff = makeDiff([
      {
        filename: "src/huge.ts",
        status: "added",
        additions: 9999,
        deletions: 0,
        patch: hugePatch,
      },
    ]);

    const [result] = distillDiffForReview(diff);
    expect(result?.patch?.length).toBeLessThan(hugePatch.length);
    expect(result?.patch).toContain("обрезано");
  });

  it("leaves small patches untouched", () => {
    const diff = makeDiff([
      {
        filename: "src/small.ts",
        status: "modified",
        additions: 1,
        deletions: 1,
        patch: "small",
      },
    ]);
    expect(distillDiffForReview(diff)[0]?.patch).toBe("small");
  });
});
