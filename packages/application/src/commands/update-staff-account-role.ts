import { CannotModifyOwnAccountError, UserAccountNotFoundError } from "../errors.js";
import type {
  DoctorRepository,
  NurseRepository,
  StaffAccountRepository,
  UserAccount,
  UserAccountRole,
} from "../ports.js";

export interface UpdateStaffAccountRoleInput {
  targetUserId: string;
  actingUserId: string;
  role: UserAccountRole;
}

export interface UpdateStaffAccountRoleDeps {
  accounts: StaffAccountRepository;
  doctors: DoctorRepository;
  nurses: NurseRepository;
}

// Promoting someone into doctor/nurse needs a professional profile row to
// exist (nurse.userId is NOT NULL, so staff-facing pages depending on it
// don't break) — mirrors the auto-provisioning the sign-up hook does for a
// brand-new account (see apps/api/src/auth.ts). Demoting away from a role
// intentionally leaves any existing profile row in place: it's already the
// accepted pattern here (doctor.userId is nullable for exactly this reason)
// and other records (appointments, past encounters) still reference it.
export async function updateStaffAccountRole(
  input: UpdateStaffAccountRoleInput,
  deps: UpdateStaffAccountRoleDeps,
): Promise<UserAccount> {
  if (input.targetUserId === input.actingUserId) {
    throw new CannotModifyOwnAccountError();
  }

  const target = await deps.accounts.findById(input.targetUserId);
  if (!target) {
    throw new UserAccountNotFoundError();
  }

  // OTP sign-in never collects a display name, so `user.name` can be empty
  // — same fallback the sign-up hook uses (see apps/api/src/auth.ts).
  const displayName = target.name || target.email;

  if (input.role === "doctor" && !(await deps.doctors.findByUserId(target.id))) {
    await deps.doctors.create({
      userId: target.id,
      name: displayName,
      specialization: "General Practice",
      imageUrl: null,
      title: null,
      department: null,
      licenseNumber: null,
      contactPhone: null,
      bio: null,
      yearsOfExperience: null,
    });
  } else if (input.role === "nurse" && !(await deps.nurses.findByUserId(target.id))) {
    await deps.nurses.create({
      userId: target.id,
      name: displayName,
      title: null,
      department: null,
      licenseNumber: null,
      contactPhone: null,
      bio: null,
      imageUrl: null,
    });
  }

  return deps.accounts.updateRole(target.id, input.role);
}
