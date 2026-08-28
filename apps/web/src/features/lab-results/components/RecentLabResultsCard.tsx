import { LabResultStatusBadge } from "@/features/lab-results/components/LabResultStatusBadge";
import { formatDate } from "@/shared/lib/format";
import type { LabResult } from "@/shared/lib/types";
import { Card, CardBody, CardHeader } from "@/shared/ui/Card";
import { Link } from "react-router-dom";

interface RecentLabResultsCardProps {
  labResults: LabResult[];
  patientId: string;
}

export function RecentLabResultsCard({ labResults, patientId }: RecentLabResultsCardProps) {
  const recent = labResults.slice(0, 5);

  return (
    <Card>
      <CardHeader
        title="Recent laboratory results"
        as="h3"
        action={
          labResults.length > 0 ? (
            <Link
              to={`/patients/${patientId}?tab=labs`}
              className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              View all {labResults.length}
            </Link>
          ) : undefined
        }
      />
      <CardBody>
        {recent.length === 0 ? (
          <p className="text-sm text-ink-muted">
            No laboratory or diagnostic work has been ordered for this patient.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {recent.map((result) => (
              <li key={result.id} className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    to={`/patients/${patientId}/lab-results/${result.id}`}
                    className="font-display text-sm font-semibold text-ink underline-offset-4 hover:text-primary hover:underline"
                  >
                    {result.testName}
                  </Link>
                  <p className="text-caption text-ink-subtle">
                    Requested {formatDate(result.requestedAt)}
                  </p>
                </div>
                <LabResultStatusBadge status={result.status} />
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
