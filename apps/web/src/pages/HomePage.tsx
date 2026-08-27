import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
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
    <AuthLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Welcome back</h1>
          <p className="mt-1 text-slate-600">Book and manage appointments with your care team.</p>
        </div>
        <Link
          to="/sign-in"
          className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Sign in
        </Link>
        <p className="text-xs text-slate-400">
          API status: <span className="font-medium">{status}</span>
        </p>
      </div>
    </AuthLayout>
  );
}
