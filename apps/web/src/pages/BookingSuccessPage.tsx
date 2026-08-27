import { CheckCircle2 } from "lucide-react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Avatar } from "../components/Avatar";
import type { Appointment } from "../lib/types";
import type { Doctor } from "../lib/use-doctors";

interface SuccessState {
  appointment: Appointment;
  doctor: Doctor | null;
}

export function BookingSuccessPage() {
  const location = useLocation();
  const state = location.state as SuccessState | null;

  if (!state?.appointment) {
    return <Navigate to="/dashboard" replace />;
  }

  const { appointment, doctor } = state;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 p-8 text-center">
      <CheckCircle2 className="h-16 w-16 text-emerald-500" />
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Your <span className="text-emerald-600">appointment request</span> has been successfully
          submitted!
        </h1>
        <p className="mt-2 text-slate-600">We will be in touch shortly to confirm.</p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3 rounded-lg border border-slate-200 bg-white p-6 text-left">
        <p className="text-sm font-medium text-slate-500">Requested appointment details</p>
        <div className="flex items-center gap-3">
          <Avatar name={doctor?.name ?? "Doctor"} imageUrl={doctor?.imageUrl} size={40} />
          <div>
            <p className="font-medium text-slate-900">{doctor?.name ?? "Selected physician"}</p>
            <p className="text-sm text-slate-500">
              {new Date(appointment.preferredSchedule).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <Link
        to="/book"
        className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
      >
        Book another appointment
      </Link>
    </main>
  );
}
