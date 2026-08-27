import type { Doctor, DoctorRepository, Nurse, NurseRepository } from "../ports.js";

export async function updateDoctorProfile(
  doctor: Doctor,
  deps: { doctors: DoctorRepository },
): Promise<Doctor> {
  return deps.doctors.update(doctor);
}

export async function updateNurseProfile(
  nurse: Nurse,
  deps: { nurses: NurseRepository },
): Promise<Nurse> {
  return deps.nurses.update(nurse);
}
