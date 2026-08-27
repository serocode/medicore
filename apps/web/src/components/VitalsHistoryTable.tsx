import type { VitalSign } from "../lib/types";

interface VitalsHistoryTableProps {
  vitals: VitalSign[];
}

function formatBp(v: VitalSign): string {
  if (v.bpSystolic == null || v.bpDiastolic == null) return "—";
  return `${v.bpSystolic}/${v.bpDiastolic}`;
}

export function VitalsHistoryTable({ vitals }: VitalsHistoryTableProps) {
  if (vitals.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
        No vitals recorded yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">BP</th>
            <th className="px-4 py-3 font-medium">HR</th>
            <th className="px-4 py-3 font-medium">Temp</th>
            <th className="px-4 py-3 font-medium">SpO₂</th>
            <th className="px-4 py-3 font-medium">Weight</th>
            <th className="px-4 py-3 font-medium">BMI</th>
            <th className="px-4 py-3 font-medium">Recorded by</th>
          </tr>
        </thead>
        <tbody>
          {vitals.map((v) => (
            <tr key={v.id} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-3 text-slate-600">
                {new Date(v.recordedAt).toLocaleString()}
              </td>
              <td className="px-4 py-3 text-slate-900">{formatBp(v)}</td>
              <td className="px-4 py-3 text-slate-900">{v.heartRate ?? "—"}</td>
              <td className="px-4 py-3 text-slate-900">{v.temperatureCelsius ?? "—"}</td>
              <td className="px-4 py-3 text-slate-900">{v.oxygenSaturation ?? "—"}</td>
              <td className="px-4 py-3 text-slate-900">{v.weightKg ?? "—"}</td>
              <td className="px-4 py-3 text-slate-900">{v.bmi ?? "—"}</td>
              <td className="px-4 py-3 text-slate-600">{v.recordedByName}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
