import { Link, useNavigate } from "react-router-dom";
import { authClient, useSession } from "../lib/auth-client";

export function NavBar() {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const role = (session?.user as { role?: string } | undefined)?.role;

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
        ) : (
          <>
            <Link to="/register" className="text-slate-600 hover:text-slate-900">
              Register
            </Link>
            <Link to="/book" className="text-slate-600 hover:text-slate-900">
              Book appointment
            </Link>
            <Link to="/dashboard" className="text-slate-600 hover:text-slate-900">
              My appointments
            </Link>
          </>
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
