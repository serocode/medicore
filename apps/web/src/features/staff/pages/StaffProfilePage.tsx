import { StaffProfileForm } from "@/features/staff/components/StaffProfileForm";
import { useStaffProfile } from "@/features/staff/hooks/use-staff-profile";
import { apiFetch } from "@/shared/lib/api-client";
import { PageHeader } from "@/shared/ui/PageHeader";
import { StatusMessage } from "@/shared/ui/StatusMessage";
import { useState } from "react";

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
