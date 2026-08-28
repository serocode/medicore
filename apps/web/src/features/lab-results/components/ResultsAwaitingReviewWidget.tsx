import { apiFetch } from "@/shared/lib/api-client";
import { formatDate } from "@/shared/lib/format";
import type { LabResultWithPatientName } from "@/shared/lib/types";
import { ButtonLink } from "@/shared/ui/Button";
import { Card, CardHeader } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { StatusMessage } from "@/shared/ui/StatusMessage";
import { ClipboardCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export function ResultsAwaitingReviewWidget() {
  const [labResults, setLabResults] = useState<LabResultWithPatientName[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    apiFetch<{ labResults: LabResultWithPatientName[] }>("/api/lab-results?status=result_available")
      .then((result) => setLabResults(result.labResults))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "We couldn't load results awaiting review."),
      );
  }, []);

  return (
    <Card>
      <CardHeader
        title="Awaiting your review"
        description="Results are not visible as final until a doctor signs off an interpretation."
        action={
          labResults && labResults.length > 0 ? (
            <span className="rounded-full bg-accent-soft-dim px-3 py-1 font-display text-xs font-semibold text-on-accent-soft">
              {labResults.length} to review
            </span>
          ) : undefined
        }
      />
      {error ? (
        <div className="p-5">
          <StatusMessage tone="error">{error}</StatusMessage>
        </div>
      ) : labResults === null ? (
        <output className="block px-5 py-6 text-center text-sm text-ink-muted">
          Loading results…
        </output>
      ) : labResults.length === 0 ? (
        <EmptyState
          bare
          icon={ClipboardCheck}
          title="You're all caught up"
          description="No uploaded results are waiting on an interpretation."
        />
      ) : (
        <ul className="divide-y divide-line">
          {labResults.map((result) => (
            <li key={result.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <Link
                  to={`/patients/${result.patientId}/lab-results/${result.id}`}
                  className="font-display text-sm font-semibold text-ink underline-offset-4 hover:text-primary hover:underline"
                >
                  {result.testName}
                </Link>
                <p className="truncate text-sm text-ink-muted">
                  {result.patientName} · uploaded{" "}
                  {result.uploadedAt ? formatDate(result.uploadedAt) : "—"}
                </p>
              </div>
              <ButtonLink
                to={`/patients/${result.patientId}/lab-results/${result.id}`}
                size="sm"
                variant="secondary"
              >
                Review
              </ButtonLink>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
