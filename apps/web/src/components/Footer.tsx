import { Link } from "react-router-dom";
import { useSession } from "../lib/auth-client";
import { Logo } from "./Logo";

/**
 * Deliberately spare: Medicore has no marketing site, careers page, or social
 * accounts to link to, so this points only at routes that exist — and only at
 * the ones that mean anything to whoever is reading it.
 */
export function Footer() {
  const { data: session } = useSession();

  return (
    <footer className="mt-auto border-t border-line bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 sm:flex-row sm:items-end sm:justify-between lg:px-8">
        <div>
          <Link to="/" aria-label="Medicore home">
            <Logo />
          </Link>
          <p className="mt-3 max-w-sm text-sm text-ink-muted">
            Appointments, clinical records, and laboratory results for one care team and the
            patients it looks after.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm sm:items-end">
          {session && (
            <Link to="/help" className="text-ink-muted underline-offset-4 hover:underline">
              How Medicore works
            </Link>
          )}
          {!session && (
            <>
              <Link to="/sign-in" className="text-ink-muted underline-offset-4 hover:underline">
                Sign in
              </Link>
              <Link to="/register" className="text-ink-muted underline-offset-4 hover:underline">
                Register as a patient
              </Link>
            </>
          )}
          <p className="text-caption text-ink-subtle">
            © {new Date().getFullYear()} Medicore. For use by registered patients and clinic staff.
          </p>
        </div>
      </div>
    </footer>
  );
}
