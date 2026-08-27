import { AlertTriangle } from "lucide-react";

interface MedicalAlertProps {
  label: string;
  value: string;
}

export function MedicalAlert({ label, value }: MedicalAlertProps) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        <span className="font-medium">{label}:</span> {value}
      </p>
    </div>
  );
}
