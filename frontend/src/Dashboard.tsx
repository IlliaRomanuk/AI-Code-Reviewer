import type { Me, Review } from "./api";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function logout(): Promise<void> {
  await fetch("/auth/logout", { method: "POST", credentials: "include" });
  window.location.reload();
}

export function Dashboard({ me, reviews }: { me: Me; reviews: Review[] }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold text-slate-900">AI Code Review Helper</h1>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>{me.login}</span>
            <button
              onClick={() => void logout()}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-100"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-slate-500">
          История ревью
        </h2>

        {reviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Пока нет ни одного ревью. Установи GitHub App на репозиторий и открой pull
            request — результат появится здесь.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Репозиторий</th>
                  <th className="px-4 py-3">PR</th>
                  <th className="px-4 py-3">Комментариев</th>
                  <th className="px-4 py-3">Когда</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reviews.map((review) => (
                  <tr key={review.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {review.repoFullName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">#{review.pullNumber}</td>
                    <td className="px-4 py-3 text-slate-600">{review.commentCount}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatDate(review.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
