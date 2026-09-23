export interface ReviewFile {
  filename: string;
  status:
    "added" | "removed" | "modified" | "renamed" | "copied" | "changed" | "unchanged";
  additions: number;
  deletions: number;
  /** Unified diff patch for this file. Undefined for binary files or huge diffs GitHub omits. */
  patch?: string;
}

export interface PullRequestDiff {
  owner: string;
  repo: string;
  pullNumber: number;
  files: ReviewFile[];
}
