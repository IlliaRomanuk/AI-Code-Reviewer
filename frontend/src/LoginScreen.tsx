export function LoginScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">AI Code Review Helper</h1>
        <p className="mt-2 text-sm text-slate-500">
          AI-ревью для pull request&#39;ов junior-разработчиков — с объяснением, почему
          так лучше.
        </p>
        <a
          href="/auth/github/login"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Войти через GitHub
        </a>
      </div>
    </div>
  );
}
