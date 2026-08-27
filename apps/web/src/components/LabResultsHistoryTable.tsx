import { useState } from "react";
import { Link } from "react-router-dom";
import type { LabResult, LabResultStatus } from "../lib/types";
import { LabResultStatusBadge } from "./LabResultStatusBadge";

interface LabResultsHistoryTableProps {
  labResults: LabResult[];
  patientId: string;
}

type SortOrder = "newest" | "oldest";

const STATUS_FILTER_OPTIONS: { value: LabResultStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "requested", label: "Requested" },
  { value: "pending", label: "Pending" },
  { value: "result_available", label: "Result Available" },
  { value: "reviewed", label: "Reviewed" },
  { value: "cancelled", label: "Cancelled" },
];

export function LabResultsHistoryTable({ labResults, patientId }: LabResultsHistoryTableProps) {
  const [statusFilter, setStatusFilter] = useState<LabResultStatus | "all">("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

  const filtered = labResults
    .filter((result) => statusFilter === "all" || result.status === statusFilter)
    .sort((a, b) => {
      const diff = new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime();
      return sortOrder === "newest" ? -diff : diff;
    });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as LabResultStatus | "all")}
          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
        >
          {STATUS_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setSortOrder((order) => (order === "newest" ? "oldest" : "newest"))}
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          Sort: {sortOrder === "newest" ? "Newest first" : "Oldest first"}
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          No laboratory or diagnostic results yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Test</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Requested</th>
                <th className="px-4 py-3 font-medium">Performed</th>
                <th className="px-4 py-3 font-medium">Released</th>
                <th className="px-4 py-3 font-medium">Requested by</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((result) => (
                <tr
                  key={result.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <Link
                      to={`/patients/${patientId}/lab-results/${result.id}`}
                      className="hover:underline"
                    >
                      {result.testName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-600">
                    {result.category.replace("_", " ")}
                  </td>
                  <td className="px-4 py-3">
                    <LabResultStatusBadge status={result.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(result.requestedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {result.datePerformed
                      ? new Date(result.datePerformed).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {result.dateReleased ? new Date(result.dateReleased).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{result.requestedByName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
