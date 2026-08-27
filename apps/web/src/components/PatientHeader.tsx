import { Droplet, Mail, Phone } from "lucide-react";
import type { Patient } from "../lib/types";
import { Avatar } from "./Avatar";
import { MedicalAlert } from "./MedicalAlert";

function calculateAge(birthDate: string): number {
  const dob = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

interface PatientHeaderProps {
  patient: Patient;
  name: string;
  email: string;
}

export function PatientHeader({ patient, name, email }: PatientHeaderProps) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6">
      <div className="flex items-start gap-4">
        <Avatar name={name} size={56} />
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-slate-900">{name}</h1>
          <p className="text-sm text-slate-500">Patient ID: {patient.id.slice(0, 8)}</p>
          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-slate-600 sm:grid-cols-3">
            <span>{calculateAge(patient.birthDate)} years old</span>
            <span className="capitalize">{patient.gender}</span>
            <span>DOB {new Date(patient.birthDate).toLocaleDateString()}</span>
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {email}
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              Emergency: {patient.emergencyContactName} · {patient.emergencyContactPhone}
            </span>
            <span className="flex items-center gap-1.5">
              <Droplet className="h-3.5 w-3.5" />
              {patient.bloodType ?? "Blood type not recorded"}
            </span>
          </div>
        </div>
      </div>
      {patient.allergies && <MedicalAlert label="Allergies" value={patient.allergies} />}
    </div>
  );
}
