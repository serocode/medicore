import { FileText } from "lucide-react";
import { API_URL } from "../lib/api-client";
import type { LabResult, LabResultParameter } from "../lib/types";
import { LabResultStatusBadge } from "./LabResultStatusBadge";

interface LabResultDetailViewProps {
  labResult: LabResult;
  parameters: LabResultParameter[];
}

function formatDateTime(value: string | null): string {
  return value ? new Date(value).toLocaleString() : "—";
}

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : "—";
}

const FLAG_CLASSES: Record<string, string> = {
  abnormal: "text-amber-700 font-medium",
  critical: "text-red-700 font-semibold",
};

export function LabResultDetailView({ labResult, parameters }: LabResultDetailViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{labResult.testName}</h1>
          <p className="text-sm text-slate-500">{labResult.category.replace("_", " ")}</p>
        </div>
        <LabResultStatusBadge status={labResult.status} />
      </div>

      <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase text-slate-400">Requested by</p>
          <p className="text-sm text-slate-900">{labResult.requestedByName}</p>
          <p className="text-xs text-slate-500">{formatDateTime(labResult.requestedAt)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-400">Date performed</p>
          <p className="text-sm text-slate-900">{formatDate(labResult.datePerformed)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-400">Date released</p>
          <p className="text-sm text-slate-900">{formatDate(labResult.dateReleased)}</p>
        </div>
        {labResult.facility && (
          <div>
            <p className="text-xs font-medium uppercase text-slate-400">Facility</p>
            <p className="text-sm text-slate-900">{labResult.facility}</p>
          </div>
        )}
        {labResult.requestNotes && (
          <div className="sm:col-span-3">
            <p className="text-xs font-medium uppercase text-slate-400">Reason for request</p>
            <p className="text-sm text-slate-900">{labResult.requestNotes}</p>
          </div>
        )}
      </div>

      {parameters.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Parameter</th>
                <th className="px-4 py-3 font-medium">Result</th>
                <th className="px-4 py-3 font-medium">Unit</th>
                <th className="px-4 py-3 font-medium">Reference Range</th>
                <th className="px-4 py-3 font-medium">Flag</th>
              </tr>
            </thead>
            <tbody>
              {parameters.map((parameter) => (
                <tr key={parameter.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 text-slate-900">{parameter.parameterName}</td>
                  <td
                    className={`px-4 py-3 ${FLAG_CLASSES[parameter.flag ?? ""] ?? "text-slate-900"}`}
                  >
                    {parameter.value}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{parameter.unit ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{parameter.referenceRange ?? "—"}</td>
                  <td className="px-4 py-3 capitalize text-slate-600">
                    {parameter.flag ?? "Normal"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(labResult.findings ||
        labResult.summary ||
        labResult.interpretation ||
        labResult.remarks) && (
        <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5">
          {labResult.findings && (
            <div>
              <h2 className="mb-1 font-medium text-slate-900">Findings</h2>
              <p className="text-sm text-slate-600">{labResult.findings}</p>
            </div>
          )}
          {labResult.summary && (
            <div>
              <h2 className="mb-1 font-medium text-slate-900">Summary</h2>
              <p className="text-sm text-slate-600">{labResult.summary}</p>
            </div>
          )}
          {labResult.interpretation && (
            <div>
              <h2 className="mb-1 font-medium text-slate-900">Interpretation</h2>
              <p className="text-sm text-slate-600">{labResult.interpretation}</p>
            </div>
          )}
          {labResult.remarks && (
            <div>
              <h2 className="mb-1 font-medium text-slate-900">Remarks</h2>
              <p className="text-sm text-slate-600">{labResult.remarks}</p>
            </div>
          )}
        </div>
      )}

      {labResult.reportFilePath && (
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-2 font-medium text-slate-900">Original Report</h2>
          <a
            href={`${API_URL}/api/uploads/${labResult.reportFilePath}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:underline"
          >
            <FileText className="h-4 w-4" />
            View Report
          </a>
        </div>
      )}

      {labResult.status === "reviewed" && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
          <h2 className="mb-2 font-medium text-emerald-900">Review</h2>
          <p className="text-sm text-emerald-800">
            Reviewed by {labResult.reviewedByName} — {formatDateTime(labResult.reviewedAt)}
          </p>
          {labResult.reviewInterpretation && (
            <p className="mt-2 text-sm text-emerald-900">
              <span className="font-medium">Interpretation: </span>
              {labResult.reviewInterpretation}
            </p>
          )}
          {labResult.reviewNotes && (
            <p className="mt-1 text-sm text-emerald-900">
              <span className="font-medium">Notes: </span>
              {labResult.reviewNotes}
            </p>
          )}
          {labResult.followUpRecommendation && (
            <p className="mt-1 text-sm text-emerald-900">
              <span className="font-medium">Follow-up: </span>
              {labResult.followUpRecommendation}
            </p>
          )}
          {labResult.actionTaken && (
            <p className="mt-1 text-sm text-emerald-900">
              <span className="font-medium">Action taken: </span>
              {labResult.actionTaken}
            </p>
          )}
        </div>
      )}

      {labResult.status === "cancelled" && labResult.cancellationReason && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-5">
          <h2 className="mb-1 font-medium text-red-900">Cancelled</h2>
          <p className="text-sm text-red-800">{labResult.cancellationReason}</p>
        </div>
      )}
    </div>
  );
}
