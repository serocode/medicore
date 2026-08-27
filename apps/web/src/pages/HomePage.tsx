import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api-client";

type HealthResponse = { status: string };

export function HomePage() {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    apiFetch<HealthResponse>("/health")
      .then((data) => setStatus(data.status === "ok" ? "ok" : "error"))
      .catch(() => setStatus("error"));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 p-8">
      <h1 className="text-3xl font-semibold text-slate-900">Healthcare</h1>
      <p className="max-w-sm text-center text-slate-600">
        Book and manage appointments with your care team.
      </p>
      <div className="flex gap-3">
        <Link
          to="/sign-in"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Sign in
        </Link>
      </div>
      <p className="text-xs text-slate-400">
        API status: <span className="font-medium">{status}</span>
      </p>
    </main>
  );
}
