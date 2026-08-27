import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { EncounterTimeline } from "../components/EncounterTimeline";
import { LabResultsHistoryTable } from "../components/LabResultsHistoryTable";
import { PatientHeader } from "../components/PatientHeader";
import { RecentLabResultsCard } from "../components/RecentLabResultsCard";
import { VitalsHistoryTable } from "../components/VitalsHistoryTable";
import { apiFetch } from "../lib/api-client";
import type { Encounter, LabResult, Patient, VitalSign } from "../lib/types";

type TabKey = "overview" | "vitals" | "timeline" | "labs";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "vitals", label: "Vitals" },
  { key: "timeline", label: "Timeline" },
  { key: "labs", label: "Labs" },
];

export function PatientClinicalRecordPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get("tab") as TabKey | null) ?? "overview";

  const [patient, setPatient] = useState<Patient | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [encounters, setEncounters] = useState<Encounter[] | null>(null);
  const [vitals, setVitals] = useState<VitalSign[] | null>(null);
  const [labResults, setLabResults] = useState<LabResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) return;
    Promise.all([
      apiFetch<{ patient: Patient; name: string; email: string }>(`/api/patients/${patientId}`),
      apiFetch<{ encounters: Encounter[] }>(`/api/patients/${patientId}/encounters`),
      apiFetch<{ vitals: VitalSign[] }>(`/api/patients/${patientId}/vitals`),
      apiFetch<{ labResults: LabResult[] }>(`/api/patients/${patientId}/lab-results`),
    ])
      .then(([patientResult, encountersResult, vitalsResult, labResultsResult]) => {
        setPatient(patientResult.patient);
        setName(patientResult.name);
        setEmail(patientResult.email);
        setEncounters(encountersResult.encounters);
        setVitals(vitalsResult.vitals);
        setLabResults(labResultsResult.labResults);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, [patientId]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-red-600">
        {error}
      </main>
    );
  }
  if (!patient) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Loading…
      </main>
    );
  }

  const latestVital = vitals?.[0];
  const latestEncounter = encounters?.[0];

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 bg-slate-50 p-8">
      <PatientHeader patient={patient} name={name} email={email} />

      <div className="flex items-center justify-between">
        <nav className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setSearchParams({ tab: t.key })}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === t.key ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="flex gap-2">
          <Link
            to={`/patients/${patientId}/lab-results/new`}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            Request Lab Test
          </Link>
          <Link
            to={`/patients/${patientId}/encounters/new`}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            New Encounter
          </Link>
        </div>
      </div>

      {tab === "overview" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="mb-2 font-medium text-slate-900">Current Medications</h2>
            <p className="text-sm text-slate-600">
              {patient.currentMedications || "None recorded"}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="mb-2 font-medium text-slate-900">Medical History</h2>
            <p className="text-sm text-slate-600">
              {patient.pastMedicalHistory || "None recorded"}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="mb-2 font-medium text-slate-900">Most Recent Vitals</h2>
            {latestVital ? (
              <p className="text-sm text-slate-600">
                BP {latestVital.bpSystolic ?? "—"}/{latestVital.bpDiastolic ?? "—"}, HR{" "}
                {latestVital.heartRate ?? "—"} bpm, Temp {latestVital.temperatureCelsius ?? "—"}°C —{" "}
                {new Date(latestVital.recordedAt).toLocaleDateString()}
              </p>
            ) : (
              <p className="text-sm text-slate-500">No vitals recorded yet</p>
            )}
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="mb-2 font-medium text-slate-900">Most Recent Encounter</h2>
            {latestEncounter ? (
              <p className="text-sm text-slate-600">
                {new Date(latestEncounter.occurredAt).toLocaleDateString()} —{" "}
                {latestEncounter.recordedByName}
              </p>
            ) : (
              <p className="text-sm text-slate-500">No encounters yet</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <RecentLabResultsCard labResults={labResults ?? []} patientId={patientId ?? ""} />
          </div>
        </div>
      )}

      {tab === "vitals" && <VitalsHistoryTable vitals={vitals ?? []} />}
      {tab === "timeline" && <EncounterTimeline encounters={encounters ?? []} />}
      {tab === "labs" && (
        <LabResultsHistoryTable labResults={labResults ?? []} patientId={patientId ?? ""} />
      )}
    </main>
  );
}
