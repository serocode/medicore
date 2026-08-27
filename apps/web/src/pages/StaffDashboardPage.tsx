import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "../components/Avatar";
import { PendingLabRequestsWidget } from "../components/PendingLabRequestsWidget";
import { ResultsAwaitingReviewWidget } from "../components/ResultsAwaitingReviewWidget";
import { apiFetch } from "../lib/api-client";
import type { PatientSummary } from "../lib/types";
import { useStaffProfile } from "../lib/use-staff-profile";

export function StaffDashboardPage() {
  const { data: profile } = useStaffProfile();
  const [patients, setPatients] = useState<PatientSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ patients: PatientSummary[] }>("/api/patients")
      .then((result) => setPatients(result.patients))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, []);

  const role = profile?.role;

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 bg-slate-50 p-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          {role === "nurse" ? "Nursing Dashboard" : "Doctor Dashboard"}
        </h1>
        <p className="text-slate-600">
          {role === "nurse"
            ? "Patients needing vitals and recent observations."
            : "Your patients and recent clinical activity."}
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="font-medium text-slate-900">Patients</h2>
        </div>
        {!error && patients === null && (
          <p className="px-5 py-6 text-center text-sm text-slate-500">Loading…</p>
        )}
        <ul className="divide-y divide-slate-100">
          {patients?.map((patient) => (
            <li key={patient.id} className="flex items-center justify-between gap-4 px-5 py-3">
              <div className="flex items-center gap-3">
                <Avatar name={patient.name} />
                <div>
                  <p className="font-medium text-slate-900">{patient.name}</p>
                  {patient.allergies && (
                    <p className="text-xs text-red-600">Allergies: {patient.allergies}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-3 text-sm">
                <Link
                  to={`/patients/${patient.id}`}
                  className="text-slate-600 hover:text-slate-900"
                >
                  View record
                </Link>
                <Link
                  to={`/patients/${patient.id}/encounters/new`}
                  className="font-medium text-slate-900 hover:underline"
                >
                  {role === "nurse" ? "Record vitals" : "New encounter"}
                </Link>
              </div>
            </li>
          ))}
          {patients?.length === 0 && (
            <li className="px-5 py-6 text-center text-sm text-slate-500">
              No patients registered yet.
            </li>
          )}
        </ul>
      </div>

      <PendingLabRequestsWidget />
      {role === "doctor" && <ResultsAwaitingReviewWidget />}
    </main>
  );
}
