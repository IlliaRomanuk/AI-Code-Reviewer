export interface Review {
  id: number;
  userId: number;
  repoFullName: string;
  pullNumber: number;
  commentCount: number;
  createdAt: string;
}

export interface Me {
  login: string;
}

/**
 * credentials: "include" — обязателен, т.к. сессия хранится в httpOnly
 * cookie, а не в localStorage/заголовке.
 */
async function apiFetch<T>(path: string): Promise<T | null> {
  const res = await fetch(path, { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`API error ${res.status} on ${path}`);
  return (await res.json()) as T;
}

export function fetchMe(): Promise<Me | null> {
  return apiFetch<Me>("/api/me");
}

export async function fetchReviews(): Promise<Review[]> {
  const data = await apiFetch<{ reviews: Review[] }>("/api/reviews");
  return data?.reviews ?? [];
}
