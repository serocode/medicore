import { AlertTriangle } from "lucide-react";

interface MedicalAlertProps {
  label: string;
  value: string;
}

export function MedicalAlert({ label, value }: MedicalAlertProps) {
  return (
    <div className="flex items-start gap-2.5 rounded-control border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm text-on-danger-soft">
      {/* Decorative — the "Allergies:" label already carries the meaning. */}
      <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        <span className="font-display font-semibold">{label}:</span> {value}
      </p>
    </div>
  );
}
