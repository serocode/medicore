import { Activity } from "lucide-react";
import { formatBloodPressure, formatDateTime, formatVital } from "../lib/format";
import type { VitalSign } from "../lib/types";
import { Card } from "./Card";
import { EmptyState } from "./EmptyState";

interface VitalsHistoryTableProps {
  vitals: VitalSign[];
}

const COLUMNS: { label: string; unit?: string; value: (v: VitalSign) => string | number }[] = [
  { label: "BP", unit: "mmHg", value: (v) => formatBloodPressure(v.bpSystolic, v.bpDiastolic) },
  { label: "HR", unit: "bpm", value: (v) => formatVital(v.heartRate) },
  { label: "Resp", unit: "/min", value: (v) => formatVital(v.respiratoryRate) },
  { label: "Temp", unit: "°C", value: (v) => formatVital(v.temperatureCelsius) },
  { label: "SpO₂", unit: "%", value: (v) => formatVital(v.oxygenSaturation) },
  { label: "Weight", unit: "kg", value: (v) => formatVital(v.weightKg) },
  { label: "BMI", value: (v) => formatVital(v.bmi) },
];

export function VitalsHistoryTable({ vitals }: VitalsHistoryTableProps) {
  if (vitals.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="No vitals recorded yet"
        description="Vitals are captured as part of an encounter and appear here in reverse order."
      />
    );
  }

  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-2xl text-left text-sm">
        <thead className="bg-surface-low text-ink-muted">
          <tr>
            <th scope="col" className="px-5 py-3 font-display font-semibold">
              Recorded
            </th>
            {COLUMNS.map((column) => (
              <th key={column.label} scope="col" className="px-4 py-3 font-display font-semibold">
                {column.label}
                {column.unit && (
                  <span className="ml-1 font-normal text-ink-subtle">({column.unit})</span>
                )}
              </th>
            ))}
            <th scope="col" className="px-5 py-3 font-display font-semibold">
              By
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {vitals.map((v) => (
            <tr key={v.id} className="hover:bg-surface">
              <th
                scope="row"
                className="whitespace-nowrap px-5 py-3 text-left font-normal text-ink-muted"
              >
                {formatDateTime(v.recordedAt)}
              </th>
              {COLUMNS.map((column) => (
                <td key={column.label} className="px-4 py-3 tabular-nums text-ink">
                  {column.value(v)}
                </td>
              ))}
              <td className="px-5 py-3 text-ink-muted">{v.recordedByName}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
