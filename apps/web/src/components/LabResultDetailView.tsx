import { FileText } from "lucide-react";
import { API_URL } from "../lib/api-client";
import { formatDate, formatDateTime } from "../lib/format";
import type { LabResult, LabResultParameter } from "../lib/types";
import { ExternalButtonLink } from "./Button";
import { Card, CardBody, CardHeader } from "./Card";
import { LabResultStatusBadge } from "./LabResultStatusBadge";

interface LabResultDetailViewProps {
  labResult: LabResult;
  parameters: LabResultParameter[];
}

function optionalDateTime(value: string | null): string {
  return value ? formatDateTime(value) : "—";
}

function optionalDate(value: string | null): string {
  return value ? formatDate(value) : "—";
}

// Out-of-range values must read as out of range before anyone parses the
// number, so the flag drives weight and colour, not just a column of text.
const FLAG_CLASSES: Record<string, string> = {
  abnormal: "font-semibold text-accent",
  critical: "font-bold text-danger",
};

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-caption uppercase tracking-wide text-ink-subtle">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{children}</dd>
    </div>
  );
}

export function LabResultDetailView({ labResult, parameters }: LabResultDetailViewProps) {
  const hasNarrative =
    labResult.findings || labResult.summary || labResult.interpretation || labResult.remarks;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-headline-lg text-ink">{labResult.testName}</h1>
          <p className="text-sm capitalize text-ink-subtle">
            {labResult.category.replace("_", " ")}
          </p>
        </div>
        <LabResultStatusBadge status={labResult.status} />
      </div>

      <Card>
        <CardBody>
          <dl className="grid gap-4 sm:grid-cols-3">
            <Fact label="Requested by">
              {labResult.requestedByName}
              <span className="mt-0.5 block text-caption text-ink-subtle">
                {formatDateTime(labResult.requestedAt)}
              </span>
            </Fact>
            <Fact label="Date performed">{optionalDate(labResult.datePerformed)}</Fact>
            <Fact label="Date released">{optionalDate(labResult.dateReleased)}</Fact>
            {labResult.facility && <Fact label="Facility">{labResult.facility}</Fact>}
            {labResult.requestNotes && (
              <div className="sm:col-span-3">
                <Fact label="Reason for request">{labResult.requestNotes}</Fact>
              </div>
            )}
          </dl>
        </CardBody>
      </Card>

      {parameters.length > 0 && (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-2xl text-left text-sm">
            <caption className="sr-only">Measured parameters for {labResult.testName}</caption>
            <thead className="bg-surface-low text-ink-muted">
              <tr>
                <th scope="col" className="px-5 py-3 font-display font-semibold">
                  Parameter
                </th>
                <th scope="col" className="px-4 py-3 font-display font-semibold">
                  Result
                </th>
                <th scope="col" className="px-4 py-3 font-display font-semibold">
                  Unit
                </th>
                <th scope="col" className="px-4 py-3 font-display font-semibold">
                  Reference range
                </th>
                <th scope="col" className="px-5 py-3 font-display font-semibold">
                  Flag
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {parameters.map((parameter) => (
                <tr key={parameter.id} className="hover:bg-surface">
                  <th scope="row" className="px-5 py-3 text-left font-medium text-ink">
                    {parameter.parameterName}
                  </th>
                  <td
                    className={`px-4 py-3 tabular-nums ${FLAG_CLASSES[parameter.flag ?? ""] ?? "text-ink"}`}
                  >
                    {parameter.value}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{parameter.unit ?? "—"}</td>
                  <td className="px-4 py-3 tabular-nums text-ink-muted">
                    {parameter.referenceRange ?? "—"}
                  </td>
                  <td className="px-5 py-3 capitalize text-ink-muted">
                    {parameter.flag ?? "Normal"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {hasNarrative && (
        <Card>
          <CardBody className="flex flex-col gap-4">
            {labResult.findings && (
              <div>
                <h2 className="font-display text-label uppercase text-ink-subtle">Findings</h2>
                <p className="mt-1 whitespace-pre-line text-sm text-ink-muted">
                  {labResult.findings}
                </p>
              </div>
            )}
            {labResult.summary && (
              <div>
                <h2 className="font-display text-label uppercase text-ink-subtle">Summary</h2>
                <p className="mt-1 whitespace-pre-line text-sm text-ink-muted">
                  {labResult.summary}
                </p>
              </div>
            )}
            {labResult.interpretation && (
              <div>
                <h2 className="font-display text-label uppercase text-ink-subtle">
                  Laboratory interpretation
                </h2>
                <p className="mt-1 whitespace-pre-line text-sm text-ink-muted">
                  {labResult.interpretation}
                </p>
              </div>
            )}
            {labResult.remarks && (
              <div>
                <h2 className="font-display text-label uppercase text-ink-subtle">Remarks</h2>
                <p className="mt-1 whitespace-pre-line text-sm text-ink-muted">
                  {labResult.remarks}
                </p>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {labResult.reportFilePath && (
        <Card>
          <CardHeader title="Original report" />
          <CardBody>
            <ExternalButtonLink
              href={`${API_URL}/api/uploads/${labResult.reportFilePath}`}
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
            >
              <FileText aria-hidden="true" className="h-4 w-4" />
              Open report
              <span className="sr-only"> (opens in a new tab)</span>
            </ExternalButtonLink>
          </CardBody>
        </Card>
      )}

      {labResult.status === "reviewed" && (
        <div className="rounded-card border border-primary-soft-dim bg-primary-soft/40 p-5">
          <h2 className="font-display text-headline-sm text-on-primary-soft">
            Reviewed by {labResult.reviewedByName}
          </h2>
          <p className="text-sm text-on-primary-soft/80">
            {optionalDateTime(labResult.reviewedAt)}
          </p>
          <dl className="mt-4 flex flex-col gap-3 border-t border-primary-soft-dim pt-4 text-sm">
            {labResult.reviewInterpretation && (
              <div>
                <dt className="font-display font-semibold text-on-primary-soft">Interpretation</dt>
                <dd className="text-on-primary-soft/90">{labResult.reviewInterpretation}</dd>
              </div>
            )}
            {labResult.reviewNotes && (
              <div>
                <dt className="font-display font-semibold text-on-primary-soft">Notes</dt>
                <dd className="text-on-primary-soft/90">{labResult.reviewNotes}</dd>
              </div>
            )}
            {labResult.followUpRecommendation && (
              <div>
                <dt className="font-display font-semibold text-on-primary-soft">Follow-up</dt>
                <dd className="text-on-primary-soft/90">{labResult.followUpRecommendation}</dd>
              </div>
            )}
            {labResult.actionTaken && (
              <div>
                <dt className="font-display font-semibold text-on-primary-soft">Action taken</dt>
                <dd className="text-on-primary-soft/90">{labResult.actionTaken}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {labResult.status === "cancelled" && labResult.cancellationReason && (
        <div className="rounded-card border border-danger/30 bg-danger-soft p-5">
          <h2 className="font-display text-headline-sm text-on-danger-soft">Cancelled</h2>
          <p className="mt-1 text-sm text-on-danger-soft">{labResult.cancellationReason}</p>
        </div>
      )}
    </div>
  );
}
