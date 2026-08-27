import { Stethoscope, User as UserIcon } from "lucide-react";
import type { Encounter } from "../lib/types";

const ENCOUNTER_TYPE_LABELS: Record<Encounter["encounterType"], string> = {
  consultation: "Consultation",
  follow_up: "Follow-up",
  nursing_check: "Nursing Check",
  vitals_only: "Vitals Only",
  other: "Other",
};

const FIELD_LABELS: { key: keyof Encounter; label: string }[] = [
  { key: "chiefComplaint", label: "Chief complaint" },
  { key: "subjective", label: "Subjective" },
  { key: "objectiveFindings", label: "Objective / Observations" },
  { key: "assessment", label: "Assessment" },
  { key: "diagnosis", label: "Diagnosis" },
  { key: "plan", label: "Plan / Intervention" },
  { key: "recommendations", label: "Recommendations / Response" },
  { key: "followUpInstructions", label: "Follow-up instructions" },
  { key: "additionalNotes", label: "Notes" },
];

interface EncounterTimelineProps {
  encounters: Encounter[];
}

export function EncounterTimeline({ encounters }: EncounterTimelineProps) {
  if (encounters.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
        No clinical records yet. Encounters will appear here after the first visit.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {encounters.map((encounter) => (
        <li key={encounter.id} className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">
                {new Date(encounter.occurredAt).toLocaleString()}
              </p>
              <p className="flex items-center gap-1.5 text-sm text-slate-500">
                <UserIcon className="h-3.5 w-3.5" />
                {encounter.recordedByName}
                <span className="capitalize">({encounter.recordedByRole})</span>
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              <Stethoscope className="h-3.5 w-3.5" />
              {ENCOUNTER_TYPE_LABELS[encounter.encounterType]}
            </span>
          </div>
          <dl className="flex flex-col gap-2 text-sm">
            {FIELD_LABELS.filter(({ key }) => encounter[key]).map(({ key, label }) => (
              <div key={key}>
                <dt className="font-medium text-slate-700">{label}</dt>
                <dd className="text-slate-600">{encounter[key] as string}</dd>
              </div>
            ))}
          </dl>
        </li>
      ))}
    </ul>
  );
}
