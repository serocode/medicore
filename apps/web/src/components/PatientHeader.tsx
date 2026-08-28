import { Droplet, Mail, Phone } from "lucide-react";
import { formatDate, significantAllergies } from "../lib/format";
import { clinicDateParts } from "../lib/timezone";
import type { Patient } from "../lib/types";
import { Avatar } from "./Avatar";
import { MedicalAlert } from "./MedicalAlert";

// Compared on the clinic's calendar, so a birthday rolls over at midnight in
// Manila rather than wherever the viewer happens to be.
function calculateAge(birthDate: string): number {
  const dob = clinicDateParts(birthDate);
  const now = clinicDateParts(new Date());
  let age = now.year - dob.year;
  const monthDiff = now.month - dob.month;
  if (monthDiff < 0 || (monthDiff === 0 && now.day < dob.day)) {
    age -= 1;
  }
  return age;
}

interface PatientHeaderProps {
  patient: Patient;
  name: string;
  email: string;
}

/**
 * Every icon here is decorative — each fact is introduced by a real <dt>, so
 * a screen reader announces "Email: …", not "mail image".
 */
export function PatientHeader({ patient, name, email }: PatientHeaderProps) {
  const allergies = significantAllergies(patient.allergies);

  return (
    <div className="flex flex-col gap-4 rounded-card border border-line bg-white p-6 shadow-ambient">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Avatar name={name} size={56} />
        <div className="min-w-0 flex-1">
          <h1 className="text-headline-md text-ink">{name}</h1>
          <p className="text-sm text-ink-subtle">
            Patient ID <span className="tabular-nums">{patient.id.slice(0, 8)}</span>
          </p>

          <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-caption uppercase tracking-wide text-ink-subtle">Age</dt>
              <dd className="text-ink">
                {calculateAge(patient.birthDate)} years · born {formatDate(patient.birthDate)}
              </dd>
            </div>
            <div>
              <dt className="text-caption uppercase tracking-wide text-ink-subtle">Gender</dt>
              <dd className="capitalize text-ink">{patient.gender}</dd>
            </div>
            <div>
              <dt className="text-caption uppercase tracking-wide text-ink-subtle">Blood type</dt>
              <dd className="flex items-center gap-1.5 text-ink">
                <Droplet aria-hidden="true" className="h-3.5 w-3.5 text-ink-subtle" />
                {patient.bloodType ?? "Not recorded"}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-caption uppercase tracking-wide text-ink-subtle">Email</dt>
              <dd className="flex items-center gap-1.5 text-ink">
                <Mail aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-ink-subtle" />
                <span className="truncate">{email}</span>
              </dd>
            </div>
            <div className="min-w-0 lg:col-span-2">
              <dt className="text-caption uppercase tracking-wide text-ink-subtle">
                Emergency contact
              </dt>
              <dd className="flex items-center gap-1.5 text-ink">
                <Phone aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-ink-subtle" />
                <span className="truncate">
                  {patient.emergencyContactName} · {patient.emergencyContactPhone}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>
      {allergies && <MedicalAlert label="Allergies" value={allergies} />}
    </div>
  );
}
