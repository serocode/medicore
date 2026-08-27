import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useSession } from "../lib/auth-client";
import { usePatientProfile } from "../lib/use-patient-profile";

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

function isStaffOrAdmin(role: string | undefined): boolean {
  return role === "admin" || role === "doctor" || role === "nurse";
}

// Gates routes that only make sense once a patient profile exists
// (booking, the patient dashboard, account management). Admins and staff
// don't have patient profiles, so the profile check is skipped for them.
export function RequirePatientProfile({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();
  const { data: patient, isLoading: isProfileLoading } = usePatientProfile();

  if (isPending) return <CenteredMessage>Loading…</CenteredMessage>;
  if (!session) return <Navigate to="/sign-in" replace />;
  if (isStaffOrAdmin((session.user as { role?: string }).role)) return <>{children}</>;

  if (isProfileLoading) return <CenteredMessage>Loading…</CenteredMessage>;
  if (!patient) return <Navigate to="/register" replace />;

  return <>{children}</>;
}

// The inverse of RequirePatientProfile: once a patient has registered,
// send them away from the registration form instead of letting them
// re-submit it.
export function RedirectIfRegistered({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();
  const { data: patient, isLoading: isProfileLoading } = usePatientProfile();

  if (isPending) return <CenteredMessage>Loading…</CenteredMessage>;
  if (!session) return <Navigate to="/sign-in" replace />;
  if (isStaffOrAdmin((session.user as { role?: string }).role)) return <>{children}</>;

  if (isProfileLoading) return <CenteredMessage>Loading…</CenteredMessage>;
  if (patient) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

// Gates clinical routes (staff dashboard, patient records, encounter
// recording) to doctor/nurse accounts only.
export function RequireStaff({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();

  if (isPending) return <CenteredMessage>Loading…</CenteredMessage>;
  if (!session) return <Navigate to="/sign-in" replace />;

  const role = (session.user as { role?: string }).role;
  if (role !== "doctor" && role !== "nurse") {
    return <Navigate to={role === "admin" ? "/admin" : "/dashboard"} replace />;
  }

  return <>{children}</>;
}
