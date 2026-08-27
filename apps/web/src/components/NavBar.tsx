import { NavLink, useNavigate } from "react-router-dom";
import { authClient, useSession } from "../lib/auth-client";
import { usePatientProfile } from "../lib/use-patient-profile";

function navLinkClassName({ isActive }: { isActive: boolean }): string {
  return isActive ? "font-medium text-slate-900" : "text-slate-600 hover:text-slate-900";
}

export function NavBar() {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const { data: patient, isLoading: isProfileLoading } = usePatientProfile();

  async function handleSignOut() {
    await authClient.signOut();
    navigate("/sign-in");
  }

  return (
    <nav className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
      <NavLink to="/" className="font-semibold text-slate-900">
        Healthcare
      </NavLink>
      <div className="flex items-center gap-4 text-sm">
        {role === "admin" ? (
          <NavLink to="/admin" className={navLinkClassName}>
            Admin dashboard
          </NavLink>
        ) : role === "doctor" || role === "nurse" ? (
          <>
            <NavLink to="/staff/dashboard" className={navLinkClassName}>
              Dashboard
            </NavLink>
            <NavLink to="/staff/profile" className={navLinkClassName}>
              My profile
            </NavLink>
          </>
        ) : isProfileLoading ? null : patient ? (
          <>
            <NavLink to="/account" className={navLinkClassName}>
              Account
            </NavLink>
            <NavLink to="/book" className={navLinkClassName}>
              Book appointment
            </NavLink>
            <NavLink to="/dashboard" className={navLinkClassName} end>
              My appointments
            </NavLink>
          </>
        ) : (
          <NavLink to="/register" className={navLinkClassName}>
            Register
          </NavLink>
        )}
        {session && (
          <button
            type="button"
            onClick={handleSignOut}
            className="text-slate-600 underline hover:text-slate-900"
          >
            Sign out
          </button>
        )}
      </div>
    </nav>
  );
}
