import { FlaskConical } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api-client";
import { formatDate } from "../lib/format";
import type { LabResultWithPatientName } from "../lib/types";
import { Card, CardHeader } from "./Card";
import { EmptyState } from "./EmptyState";
import { LabResultStatusBadge } from "./LabResultStatusBadge";
import { StatusMessage } from "./StatusMessage";

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
        setError(err instanceof Error ? err.message : "We couldn't load pending requests."),
      );
  }, []);

  return (
    <Card>
      <CardHeader
        title="Laboratory requests"
        description="Ordered tests still waiting on a result."
      />
      {error ? (
        <div className="p-5">
          <StatusMessage tone="error">{error}</StatusMessage>
        </div>
      ) : labResults === null ? (
        <output className="block px-5 py-6 text-center text-sm text-ink-muted">
          Loading requests…
        </output>
      ) : labResults.length === 0 ? (
        <EmptyState
          bare
          icon={FlaskConical}
          title="Nothing outstanding"
          description="Every requested test has a result attached."
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
                  {result.patientName} · requested {formatDate(result.requestedAt)}
                </p>
              </div>
              <LabResultStatusBadge status={result.status} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
