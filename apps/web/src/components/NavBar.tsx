import { Link, useNavigate } from "react-router-dom";
import { authClient, useSession } from "../lib/auth-client";
import { usePatientProfile } from "../lib/use-patient-profile";

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
      <Link to="/" className="font-semibold text-slate-900">
        Healthcare
      </Link>
      <div className="flex items-center gap-4 text-sm">
        {role === "admin" ? (
          <Link to="/admin" className="text-slate-600 hover:text-slate-900">
            Admin dashboard
          </Link>
        ) : role === "doctor" || role === "nurse" ? (
          <>
            <Link to="/staff/dashboard" className="text-slate-600 hover:text-slate-900">
              Dashboard
            </Link>
            <Link to="/staff/profile" className="text-slate-600 hover:text-slate-900">
              My profile
            </Link>
          </>
        ) : isProfileLoading ? null : patient ? (
          <>
            <Link to="/account" className="text-slate-600 hover:text-slate-900">
              Account
            </Link>
            <Link to="/book" className="text-slate-600 hover:text-slate-900">
              Book appointment
            </Link>
            <Link to="/dashboard" className="text-slate-600 hover:text-slate-900">
              My appointments
            </Link>
          </>
        ) : (
          <Link to="/register" className="text-slate-600 hover:text-slate-900">
            Register
          </Link>
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
