import { Search, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Avatar } from "../components/Avatar";
import { ButtonLink } from "../components/Button";
import { Card, CardHeader } from "../components/Card";
import { EmptyState } from "../components/EmptyState";
import { Field, TextInput } from "../components/Field";
import { PageHeader } from "../components/PageHeader";
import { PendingLabRequestsWidget } from "../components/PendingLabRequestsWidget";
import { ResultsAwaitingReviewWidget } from "../components/ResultsAwaitingReviewWidget";
import { StatusMessage } from "../components/StatusMessage";
import { UpcomingAppointmentsWidget } from "../components/UpcomingAppointmentsWidget";
import { apiFetch } from "../lib/api-client";
import { displayName, significantAllergies } from "../lib/format";
import type { PatientSummary } from "../lib/types";
import { useStaffProfile } from "../lib/use-staff-profile";

export function StaffDashboardPage() {
  const { data: profile } = useStaffProfile();
  const [patients, setPatients] = useState<PatientSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    apiFetch<{ patients: PatientSummary[] }>("/api/patients")
      .then((result) => setPatients(result.patients))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "We couldn't load the patient list."),
      );
  }, []);

  const role = profile?.role;

  const filtered = useMemo(() => {
    if (!patients) return null;
    const term = query.trim().toLowerCase();
    if (!term) return patients;
    return patients.filter((patient) => displayName(patient.name).toLowerCase().includes(term));
  }, [patients, query]);

  return (
    <>
      <PageHeader
        title={role === "nurse" ? "Nursing dashboard" : "Clinical dashboard"}
        description={
          role === "nurse"
            ? "Today's schedule, patients needing vitals, and laboratory work in progress."
            : "Today's schedule, your patients, and the results waiting on your signature."
        }
      />

      {error && <StatusMessage tone="error">{error}</StatusMessage>}

      {role && (
        <div className="grid gap-6 lg:grid-cols-2">
          <UpcomingAppointmentsWidget role={role} />
          <PendingLabRequestsWidget />
          {role === "doctor" && (
            <div className="lg:col-span-2">
              <ResultsAwaitingReviewWidget />
            </div>
          )}
        </div>
      )}

      <Card>
        <CardHeader
          title="Patients"
          description="Open a record to review history, or start a new encounter."
          action={
            patients && patients.length > 5 ? (
              <div className="w-56">
                <Field label="Search patients" htmlFor="patient-search">
                  <TextInput
                    id="patient-search"
                    type="search"
                    icon={Search}
                    placeholder="Search by name"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </Field>
              </div>
            ) : undefined
          }
        />

        {!error && patients === null && (
          <output className="block px-5 py-6 text-center text-sm text-ink-muted">
            Loading patients…
          </output>
        )}

        {filtered?.length === 0 && (
          <EmptyState
            bare
            icon={Users}
            title={query ? "No patients match that search" : "No patients registered yet"}
            description={
              query
                ? "Check the spelling, or clear the search to see everyone."
                : "Patient records appear here once someone completes registration."
            }
          />
        )}

        {filtered && filtered.length > 0 && (
          <ul className="divide-y divide-line">
            {filtered.map((patient) => {
              const allergies = significantAllergies(patient.allergies);
              const name = displayName(patient.name);
              return (
                <li
                  key={patient.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={name} size={36} />
                    <div className="min-w-0">
                      <p className="truncate font-display font-semibold text-ink">{name}</p>
                      {allergies ? (
                        <p className="truncate text-caption font-semibold text-danger">
                          Allergies: {allergies}
                        </p>
                      ) : (
                        <p className="text-caption text-ink-subtle">No recorded allergies</p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <ButtonLink to={`/patients/${patient.id}`} variant="secondary" size="sm">
                      View record
                    </ButtonLink>
                    <ButtonLink to={`/patients/${patient.id}/encounters/new`} size="sm">
                      {role === "nurse" ? "Record vitals" : "New encounter"}
                    </ButtonLink>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
