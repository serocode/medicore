import type { Doctor, DoctorRepository } from "../ports.js";

export async function listDoctors(deps: { doctors: DoctorRepository }): Promise<Doctor[]> {
  return deps.doctors.list();
}
