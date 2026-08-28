import {
  LAB_RESULT_STATUS_LABELS,
  LabResultStatusBadge,
} from "@/features/lab-results/components/LabResultStatusBadge";
import { formatDate } from "@/shared/lib/format";
import type { LabResult, LabResultStatus } from "@/shared/lib/types";
import { Card } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Field, Select } from "@/shared/ui/Field";
import { FlaskConical } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

interface LabResultsHistoryTableProps {
  labResults: LabResult[];
  patientId: string;
}

type SortOrder = "newest" | "oldest";

const STATUS_ORDER: LabResultStatus[] = [
  "requested",
  "pending",
  "result_available",
  "reviewed",
  "cancelled",
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

  if (labResults.length === 0) {
    return (
      <EmptyState
        icon={FlaskConical}
        title="No laboratory results yet"
        description="Tests you order for this patient appear here from request through to review."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-52">
          <Field label="Filter by status" htmlFor="lab-status-filter">
            <Select
              id="lab-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as LabResultStatus | "all")}
            >
              <option value="all">All statuses</option>
              {STATUS_ORDER.map((status) => (
                <option key={status} value={status}>
                  {LAB_RESULT_STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="w-52">
          <Field label="Sort by date" htmlFor="lab-sort">
            <Select
              id="lab-sort"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as SortOrder)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </Select>
          </Field>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="Nothing matches that filter"
          description="Choose “All statuses” to see this patient's full laboratory history."
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-3xl text-left text-sm">
            <thead className="bg-surface-low text-ink-muted">
              <tr>
                <th scope="col" className="px-5 py-3 font-display font-semibold">
                  Test
                </th>
                <th scope="col" className="px-4 py-3 font-display font-semibold">
                  Category
                </th>
                <th scope="col" className="px-4 py-3 font-display font-semibold">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 font-display font-semibold">
                  Requested
                </th>
                <th scope="col" className="px-4 py-3 font-display font-semibold">
                  Performed
                </th>
                <th scope="col" className="px-4 py-3 font-display font-semibold">
                  Released
                </th>
                <th scope="col" className="px-5 py-3 font-display font-semibold">
                  Requested by
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((result) => (
                <tr key={result.id} className="hover:bg-surface">
                  <th scope="row" className="px-5 py-3 text-left">
                    <Link
                      to={`/patients/${patientId}/lab-results/${result.id}`}
                      className="font-display font-semibold text-ink underline-offset-4 hover:text-primary hover:underline"
                    >
                      {result.testName}
                    </Link>
                  </th>
                  <td className="px-4 py-3 capitalize text-ink-muted">
                    {result.category.replace("_", " ")}
                  </td>
                  <td className="px-4 py-3">
                    <LabResultStatusBadge status={result.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-muted">
                    {formatDate(result.requestedAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-muted">
                    {result.datePerformed ? formatDate(result.datePerformed) : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-muted">
                    {result.dateReleased ? formatDate(result.dateReleased) : "—"}
                  </td>
                  <td className="px-5 py-3 text-ink-muted">{result.requestedByName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
