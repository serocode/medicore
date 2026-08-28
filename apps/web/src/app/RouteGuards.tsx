import { usePatientProfile } from "@/features/patients/hooks/use-patient-profile";
import { useSession } from "@/shared/lib/auth-client";
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

function CenteredMessage({ children }: { children: ReactNode }) {
  return (
    <output className="flex min-h-screen items-center justify-center bg-surface text-ink-muted">
      {children}
    </output>
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
  const isStaff = isStaffOrAdmin((session?.user as { role?: string } | undefined)?.role);
  const { data: patient, isLoading: isProfileLoading } = usePatientProfile({
    enabled: Boolean(session) && !isStaff,
  });

  if (isPending) return <CenteredMessage>Loading…</CenteredMessage>;
  if (!session) return <Navigate to="/sign-in" replace />;
  if (isStaff) return <>{children}</>;

  if (isProfileLoading) return <CenteredMessage>Loading…</CenteredMessage>;
  if (!patient) return <Navigate to="/register" replace />;

  return <>{children}</>;
}

// The inverse of RequirePatientProfile: once a patient has registered,
// send them away from the registration form instead of letting them
// re-submit it.
export function RedirectIfRegistered({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();
  const isStaff = isStaffOrAdmin((session?.user as { role?: string } | undefined)?.role);
  const { data: patient, isLoading: isProfileLoading } = usePatientProfile({
    enabled: Boolean(session) && !isStaff,
  });

  if (isPending) return <CenteredMessage>Loading…</CenteredMessage>;
  if (!session) return <Navigate to="/sign-in" replace />;
  if (isStaff) return <>{children}</>;

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
