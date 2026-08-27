import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api-client";
import type { LabResultWithPatientName } from "../lib/types";

export function PendingLabRequestsWidget() {
  const [labResults, setLabResults] = useState<LabResultWithPatientName[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    apiFetch<{ labResults: LabResultWithPatientName[] }>(
      "/api/lab-results?status=requested&status=pending",
    )
      .then((result) => setLabResults(result.labResults))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load pending requests"),
      );
  }, []);

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-3">
        <h2 className="font-medium text-slate-900">Pending Laboratory Requests</h2>
      </div>
      {error ? (
        <p className="px-5 py-6 text-center text-sm text-red-600">{error}</p>
      ) : labResults === null ? (
        <p className="px-5 py-6 text-center text-sm text-slate-500">Loading…</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {labResults.map((result) => (
            <li key={result.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <Link
                to={`/patients/${result.patientId}/lab-results/${result.id}`}
                className="text-slate-900 hover:underline"
              >
                {result.testName} — {result.patientName}
              </Link>
              <span className="text-xs text-slate-500">
                {new Date(result.requestedAt).toLocaleDateString()}
              </span>
            </li>
          ))}
          {labResults.length === 0 && (
            <li className="px-5 py-6 text-center text-sm text-slate-500">No pending requests.</li>
          )}
        </ul>
      )}
    </div>
  );
}
