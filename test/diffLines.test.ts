import { describe, it, expect } from "vitest";
import { extractValidRightLines } from "../src/review/diffLines.js";

describe("extractValidRightLines", () => {
  it("returns an empty set for an undefined patch", () => {
    expect(extractValidRightLines(undefined)).toEqual(new Set());
  });

  it("collects added and context lines, skips removed lines", () => {
    const patch = [
      "@@ -10,3 +10,4 @@",
      " context before",
      "-removed line",
      "+added line one",
      "+added line two",
      " context after",
    ].join("\n");

    // new-side numbering starting at 10: context(10) -removed(skip) +added(11) +added(12) context(13)
    expect(extractValidRightLines(patch)).toEqual(new Set([10, 11, 12, 13]));
  });

  it("handles multiple hunks in one patch, resetting the counter per hunk", () => {
    const patch = [
      "@@ -1,2 +1,2 @@",
      " line one",
      "+line two",
      "@@ -50,2 +55,2 @@",
      " line fifty-five",
      "+line fifty-six",
    ].join("\n");

    expect(extractValidRightLines(patch)).toEqual(new Set([1, 2, 55, 56]));
  });

  it("ignores '\\ No newline at end of file' markers without shifting the counter", () => {
    const patch = ["@@ -1,1 +1,1 @@", "+only line", "\\ No newline at end of file"].join(
      "\n",
    );
    expect(extractValidRightLines(patch)).toEqual(new Set([1]));
  });
});
