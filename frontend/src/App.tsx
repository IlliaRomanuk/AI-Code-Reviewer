import { useEffect, useState } from "react";
import { fetchMe, fetchReviews, type Me, type Review } from "./api";
import { LoginScreen } from "./LoginScreen";
import { Dashboard } from "./Dashboard";

type LoadState = "loading" | "anonymous" | "authenticated" | "error";

export default function App() {
  const [state, setState] = useState<LoadState>("loading");
  const [me, setMe] = useState<Me | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const meResult = await fetchMe();
        if (cancelled) return;

        if (!meResult) {
          setState("anonymous");
          return;
        }

        const reviewsResult = await fetchReviews();
        if (cancelled) return;

        setMe(meResult);
        setReviews(reviewsResult);
        setState("authenticated");
      } catch (err) {
        console.error("[app] failed to load session:", err);
        if (!cancelled) setState("error");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        Загрузка…
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center text-red-500">
        Не удалось связаться с backend. Проверь, что сервер запущен на localhost:3000.
      </div>
    );
  }

  if (state === "authenticated" && me) {
    return <Dashboard me={me} reviews={reviews} />;
  }

  return <LoginScreen />;
}
