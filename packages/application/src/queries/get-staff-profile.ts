import type { Doctor, DoctorRepository, Nurse, NurseRepository, StaffRole } from "../ports.js";

export interface StaffProfile {
  role: StaffRole;
  doctor?: Doctor;
  nurse?: Nurse;
}

// `role` must come from the caller's authenticated session (`user.role`),
// not be inferred from which profile row exists — an account can be
// promoted/demoted between doctor and nurse by an administrator without its
// old profile row being deleted (see updateStaffAccountRole), so probing
// "does a doctor row exist?" first would keep reporting the old role forever.
export async function getStaffProfileByUserId(
  userId: string,
  role: StaffRole,
  deps: { doctors: DoctorRepository; nurses: NurseRepository },
): Promise<StaffProfile | null> {
  if (role === "doctor") {
    const doctor = await deps.doctors.findByUserId(userId);
    return doctor ? { role: "doctor", doctor } : null;
  }

  const nurse = await deps.nurses.findByUserId(userId);
  return nurse ? { role: "nurse", nurse } : null;
}
