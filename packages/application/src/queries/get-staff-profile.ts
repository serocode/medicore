import type { Doctor, DoctorRepository, Nurse, NurseRepository, StaffRole } from "../ports.js";

export interface StaffProfile {
  role: StaffRole;
  doctor?: Doctor;
  nurse?: Nurse;
}

export async function getStaffProfileByUserId(
  userId: string,
  deps: { doctors: DoctorRepository; nurses: NurseRepository },
): Promise<StaffProfile | null> {
  const doctor = await deps.doctors.findByUserId(userId);
  if (doctor) return { role: "doctor", doctor };

  const nurse = await deps.nurses.findByUserId(userId);
  if (nurse) return { role: "nurse", nurse };

  return null;
}
