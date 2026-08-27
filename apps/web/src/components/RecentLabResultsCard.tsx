import { Link } from "react-router-dom";
import type { LabResult } from "../lib/types";
import { LabResultStatusBadge } from "./LabResultStatusBadge";

interface RecentLabResultsCardProps {
  labResults: LabResult[];
  patientId: string;
}

export function RecentLabResultsCard({ labResults, patientId }: RecentLabResultsCardProps) {
  const recent = labResults.slice(0, 5);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-medium text-slate-900">Recent Laboratory Results</h2>
        <Link
          to={`/patients/${patientId}?tab=labs`}
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          View all
        </Link>
      </div>
      {recent.length === 0 ? (
        <p className="text-sm text-slate-500">No laboratory or diagnostic results yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {recent.map((result) => (
            <li key={result.id} className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{result.testName}</p>
                <p className="text-xs text-slate-500">
                  {new Date(result.requestedAt).toLocaleDateString()}
                </p>
              </div>
              <LabResultStatusBadge status={result.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
