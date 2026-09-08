import { EncounterTimeline } from "@/features/encounters/components/EncounterTimeline";
import { VitalsHistoryTable } from "@/features/encounters/components/VitalsHistoryTable";
import { LabResultsHistoryTable } from "@/features/lab-results/components/LabResultsHistoryTable";
import { RecentLabResultsCard } from "@/features/lab-results/components/RecentLabResultsCard";
import { PatientHeader } from "@/features/patients/components/PatientHeader";
import { apiFetch } from "@/shared/lib/api-client";
import { displayName, formatBloodPressure, formatDate, formatVital } from "@/shared/lib/format";
import type { Encounter, LabResult, Patient, VitalSign } from "@/shared/lib/types";
import { useDocumentTitle } from "@/shared/lib/use-document-title";
import { Breadcrumbs } from "@/shared/ui/Breadcrumbs";
import { ButtonLink } from "@/shared/ui/Button";
import { Card, CardBody } from "@/shared/ui/Card";
import { StatusMessage } from "@/shared/ui/StatusMessage";
import { TabPanel, Tabs } from "@/shared/ui/Tabs";
import { FlaskConical, Stethoscope } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

type TabKey = "overview" | "vitals" | "timeline" | "labs";

const TAB_KEYS: TabKey[] = ["overview", "vitals", "timeline", "labs"];

function isTabKey(value: string | null): value is TabKey {
  return value !== null && (TAB_KEYS as string[]).includes(value);
}

function SummaryCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardBody>
        <h3 className="font-display text-label uppercase text-ink-subtle">{title}</h3>
        <div className="mt-2 text-sm text-ink-muted">{children}</div>
      </CardBody>
    </Card>
  );
}

export function PatientClinicalRecordPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: TabKey = isTabKey(tabParam) ? tabParam : "overview";

  const [patient, setPatient] = useState<Patient | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [encounters, setEncounters] = useState<Encounter[] | null>(null);
  const [vitals, setVitals] = useState<VitalSign[] | null>(null);
  const [labResults, setLabResults] = useState<LabResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useDocumentTitle(name ? `${displayName(name)} — clinical record` : undefined);

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
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "We couldn't load this record."),
      );
  }, [patientId]);

  if (error) return <StatusMessage tone="error">{error}</StatusMessage>;
  if (!patient) return <output className="text-sm text-ink-muted">Loading the record…</output>;

  const latestVital = vitals?.[0];
  const latestEncounter = encounters?.[0];

  return (
    <>
      <Breadcrumbs
        items={[{ label: "Dashboard", to: "/staff/dashboard" }, { label: displayName(name) }]}
      />

      <PatientHeader patient={patient} name={displayName(name)} email={email} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          label="Clinical record sections"
          idPrefix="record"
          activeId={tab}
          onChange={(next) => setSearchParams({ tab: next })}
          tabs={[
            { id: "overview", label: "Overview" },
            { id: "vitals", label: "Vitals", count: vitals?.length },
            { id: "timeline", label: "Timeline", count: encounters?.length },
            { id: "labs", label: "Labs", count: labResults?.length },
          ]}
        />
        <div className="flex flex-wrap gap-2">
          <ButtonLink to={`/patients/${patientId}/lab-results/new`} variant="secondary" size="sm">
            <FlaskConical aria-hidden="true" className="h-4 w-4" />
            Request lab test
          </ButtonLink>
          <ButtonLink to={`/patients/${patientId}/encounters/new`} size="sm">
            <Stethoscope aria-hidden="true" className="h-4 w-4" />
            New encounter
          </ButtonLink>
        </div>
      </div>

      <TabPanel id="overview" activeId={tab} idPrefix="record">
        <div className="grid gap-4 sm:grid-cols-2">
          <SummaryCard title="Current medications">
            {patient.currentMedications || "None recorded"}
          </SummaryCard>
          <SummaryCard title="Medical history">
            {patient.pastMedicalHistory || "None recorded"}
          </SummaryCard>
          <SummaryCard title="Most recent vitals">
            {latestVital ? (
              <>
                <span className="tabular-nums">
                  BP {formatBloodPressure(latestVital.bpSystolic, latestVital.bpDiastolic)} · HR{" "}
                  {formatVital(latestVital.heartRate, "bpm")} · Temp{" "}
                  {formatVital(latestVital.temperatureCelsius, "°C")}
                </span>
                <span className="mt-1 block text-caption text-ink-subtle">
                  Recorded {formatDate(latestVital.recordedAt)}
                </span>
              </>
            ) : (
              "No vitals recorded yet"
            )}
          </SummaryCard>
          <SummaryCard title="Most recent encounter">
            {latestEncounter ? (
              <>
                {formatDate(latestEncounter.occurredAt)}
                <span className="mt-1 block text-caption text-ink-subtle">
                  {latestEncounter.recordedByName}
                </span>
              </>
            ) : (
              "No encounters yet"
            )}
          </SummaryCard>

          <div className="sm:col-span-2">
            <RecentLabResultsCard labResults={labResults ?? []} patientId={patientId ?? ""} />
          </div>
        </div>
      </TabPanel>

      <TabPanel id="vitals" activeId={tab} idPrefix="record">
        <VitalsHistoryTable vitals={vitals ?? []} />
      </TabPanel>

      <TabPanel id="timeline" activeId={tab} idPrefix="record">
        <EncounterTimeline encounters={encounters ?? []} />
      </TabPanel>

      <TabPanel id="labs" activeId={tab} idPrefix="record">
        <LabResultsHistoryTable labResults={labResults ?? []} patientId={patientId ?? ""} />
      </TabPanel>
    </>
  );
}
