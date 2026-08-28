import { formatDateTime } from "@/shared/lib/format";
import type { Encounter } from "@/shared/lib/types";
import { Card, CardBody } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { NotebookPen, Stethoscope, User as UserIcon } from "lucide-react";

const ENCOUNTER_TYPE_LABELS: Record<Encounter["encounterType"], string> = {
  consultation: "Consultation",
  follow_up: "Follow-up",
  nursing_check: "Nursing check",
  vitals_only: "Vitals only",
  other: "Other",
};

const FIELD_LABELS: { key: keyof Encounter; label: string }[] = [
  { key: "chiefComplaint", label: "Chief complaint" },
  { key: "subjective", label: "Subjective" },
  { key: "objectiveFindings", label: "Objective / observations" },
  { key: "assessment", label: "Assessment" },
  { key: "diagnosis", label: "Diagnosis" },
  { key: "plan", label: "Plan / intervention" },
  { key: "recommendations", label: "Recommendations / response" },
  { key: "followUpInstructions", label: "Follow-up instructions" },
  { key: "additionalNotes", label: "Notes" },
];

interface EncounterTimelineProps {
  encounters: Encounter[];
}

export function EncounterTimeline({ encounters }: EncounterTimelineProps) {
  if (encounters.length === 0) {
    return (
      <EmptyState
        icon={NotebookPen}
        title="No clinical records yet"
        description="Encounters appear here after the first visit, newest first."
      />
    );
  }

  return (
    <ol className="flex flex-col gap-4">
      {encounters.map((encounter) => (
        <li key={encounter.id}>
          <Card>
            <CardBody>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display font-semibold text-ink">
                    {formatDateTime(encounter.occurredAt)}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-muted">
                    <UserIcon aria-hidden="true" className="h-3.5 w-3.5" />
                    {encounter.recordedByName}
                    <span className="capitalize text-ink-subtle">({encounter.recordedByRole})</span>
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-2.5 py-1 font-display text-xs font-semibold text-ink-muted">
                  <Stethoscope aria-hidden="true" className="h-3.5 w-3.5" />
                  {ENCOUNTER_TYPE_LABELS[encounter.encounterType]}
                </span>
              </div>
              <dl className="mt-4 flex flex-col gap-3 border-t border-line pt-4 text-sm">
                {FIELD_LABELS.filter(({ key }) => encounter[key]).map(({ key, label }) => (
                  <div key={key}>
                    <dt className="text-caption uppercase tracking-wide text-ink-subtle">
                      {label}
                    </dt>
                    <dd className="mt-0.5 whitespace-pre-line text-ink-muted">
                      {encounter[key] as string}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardBody>
          </Card>
        </li>
      ))}
    </ol>
  );
}
