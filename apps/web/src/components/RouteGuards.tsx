import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useSession } from "../lib/auth-client";

function CenteredMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
      {children}
    </div>
  );
}

// Session/role checks here are for UX only — routing decisions never
// substitute for server-side authorization, which the API enforces on
// every request (see requireAuth/requireAdmin in apps/api).
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();

  if (isPending) return <CenteredMessage>Loading…</CenteredMessage>;
  if (!session) return <Navigate to="/sign-in" replace />;

  return <>{children}</>;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();

  if (isPending) return <CenteredMessage>Loading…</CenteredMessage>;
  if (!session) return <Navigate to="/sign-in" replace />;
  if ((session.user as { role?: string }).role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
