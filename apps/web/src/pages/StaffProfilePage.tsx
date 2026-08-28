import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { StaffProfileForm } from "../components/StaffProfileForm";
import { StatusMessage } from "../components/StatusMessage";
import { apiFetch } from "../lib/api-client";
import { useStaffProfile } from "../lib/use-staff-profile";

export function StaffProfilePage() {
  const { data: profile, isLoading, error } = useStaffProfile();
  const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined);

  if (isLoading) {
    return <output className="text-sm text-ink-muted">Loading your profile…</output>;
  }

  if (error || !profile) {
    return <StatusMessage tone="error">{error ?? "We couldn't find your profile."}</StatusMessage>;
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Dashboard", to: "/staff/dashboard" }, { label: "My profile" }]}
        title="Your professional profile"
        description="Patients see your name and specialisation when they book. Keep it current for them and for your colleagues."
      />

      {successMessage && <StatusMessage tone="success">{successMessage}</StatusMessage>}

      <StaffProfileForm
        profile={profile}
        onSubmit={async (payload) => {
          setSuccessMessage(undefined);
          await apiFetch("/api/staff/me", { method: "PATCH", body: JSON.stringify(payload) });
          setSuccessMessage("Your profile has been saved.");
        }}
      />
    </>
  );
}
