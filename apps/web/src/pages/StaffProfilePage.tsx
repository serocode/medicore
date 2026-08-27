import { useState } from "react";
import { AuthLayout } from "../components/AuthLayout";
import { StaffProfileForm } from "../components/StaffProfileForm";
import { apiFetch } from "../lib/api-client";
import { useStaffProfile } from "../lib/use-staff-profile";

export function StaffProfilePage() {
  const { data: profile, isLoading, error } = useStaffProfile();
  const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Loading…
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        {error ?? "Profile not found."}
      </main>
    );
  }

  return (
    <AuthLayout wide>
      <h1 className="text-2xl font-semibold text-slate-900">Your professional profile</h1>
      <p className="mb-8 mt-1 text-slate-600">
        Keep your details up to date for your colleagues and patients.
      </p>
      {successMessage && <p className="mb-4 text-sm text-emerald-600">{successMessage}</p>}
      <StaffProfileForm
        profile={profile}
        onSubmit={async (payload) => {
          setSuccessMessage(undefined);
          await apiFetch("/api/staff/me", { method: "PATCH", body: JSON.stringify(payload) });
          setSuccessMessage("Profile updated.");
        }}
      />
    </AuthLayout>
  );
}
