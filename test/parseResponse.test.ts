import { describe, it, expect } from "vitest";
import { parseReviewResponse } from "../src/ai/parseResponse.js";

describe("parseReviewResponse", () => {
  it("parses a clean JSON array", () => {
    const raw = '[{"filename":"a.ts","line":5,"body":"comment"}]';
    expect(parseReviewResponse(raw)).toEqual([
      { filename: "a.ts", line: 5, body: "comment" },
    ]);
  });

  it("strips a ```json code fence the model sometimes adds anyway", () => {
    const raw = '```json\n[{"filename":"a.ts","body":"comment"}]\n```';
    expect(parseReviewResponse(raw)).toHaveLength(1);
  });

  it("drops invalid entries but keeps valid ones", () => {
    const raw = JSON.stringify([
      { filename: "a.ts", body: "ok" },
      { filename: 123, body: "bad filename type" },
      { body: "missing filename" },
    ]);
    expect(parseReviewResponse(raw)).toEqual([{ filename: "a.ts", body: "ok" }]);
  });

  it("returns an empty array for malformed JSON instead of throwing", () => {
    expect(parseReviewResponse("not json at all")).toEqual([]);
  });

  it("returns an empty array when the top-level value isn't an array", () => {
    expect(
      parseReviewResponse('{"filename":"a.ts","body":"oops, not an array"}'),
    ).toEqual([]);
  });
});
