import type { Octokit } from "@octokit/rest";
import type { PullRequestDiff, ReviewFile } from "../review/types.js";

const MAX_FILES = 100 * 30; // 30 страниц по 100 — щедрый потолок для очень больших PR

/**
 * Тянет список изменённых файлов PR вместе с unified-diff патчем на файл.
 * listFiles (а не .get с mediaType diff) выбран специально: он уже даёт
 * файл, статус, additions/deletions и patch по отдельности — не нужно
 * парсить сырой git-diff вручную.
 */
export async function fetchPullRequestDiff(
  octokit: Octokit,
  owner: string,
  repo: string,
  pullNumber: number,
): Promise<PullRequestDiff> {
  const files: ReviewFile[] = [];

  for await (const response of octokit.paginate.iterator(octokit.rest.pulls.listFiles, {
    owner,
    repo,
    pull_number: pullNumber,
    per_page: 100,
  })) {
    for (const file of response.data) {
      files.push({
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        patch: file.patch,
      });
      if (files.length >= MAX_FILES) break;
    }
    if (files.length >= MAX_FILES) break;
  }

  return { owner, repo, pullNumber, files };
}
