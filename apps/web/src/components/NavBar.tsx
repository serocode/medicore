import { LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { authClient, useSession } from "../lib/auth-client";
import { usePatientProfile } from "../lib/use-patient-profile";
import { Avatar } from "./Avatar";
import { Logo } from "./Logo";

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  patient: "Patient",
  doctor: "Doctor",
  nurse: "Nurse",
  admin: "Administrator",
};

function navLinkClassName({ isActive }: { isActive: boolean }): string {
  return [
    "rounded-control px-3 py-2 font-display text-sm font-semibold transition-colors",
    isActive ? "bg-primary-soft text-on-primary-soft" : "text-ink-muted hover:bg-surface-container",
  ].join(" ");
}

function drawerLinkClassName({ isActive }: { isActive: boolean }): string {
  return [
    "block rounded-control px-3 py-2.5 font-display text-sm font-semibold transition-colors",
    isActive ? "bg-primary-soft text-on-primary-soft" : "text-ink-muted hover:bg-surface-container",
  ].join(" ");
}

export function NavBar() {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const role = (session?.user as { role?: string } | undefined)?.role;
  // Only patients have a profile to look up; a staff role would just 404.
  const isPatientRole =
    Boolean(session) && role !== "admin" && role !== "doctor" && role !== "nurse";
  const { data: patient, isLoading: isProfileLoading } = usePatientProfile({
    enabled: isPatientRole,
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Navigating with the drawer open should close it — otherwise the panel
  // stays over the page the user just asked for.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the pathname is the signal.
  useEffect(() => setIsDrawerOpen(false), [location.pathname]);

  async function handleSignOut() {
    await authClient.signOut();
    navigate("/sign-in");
  }

  let items: NavItem[] = [];
  if (role === "admin") {
    items = [{ to: "/admin", label: "Dashboard" }];
  } else if (role === "doctor" || role === "nurse") {
    items = [
      { to: "/staff/dashboard", label: "Dashboard" },
      { to: "/staff/profile", label: "My profile" },
    ];
  } else if (!isProfileLoading) {
    items = patient
      ? [
          { to: "/dashboard", label: "My appointments", end: true },
          { to: "/book", label: "Book appointment" },
          { to: "/account", label: "Account" },
        ]
      : [{ to: "/register", label: "Complete registration" }];
  }

  // Every signed-in role gets the guide; it is the last item so it never
  // competes with the role's actual work.
  if (session) items = [...items, { to: "/help", label: "Help" }];

  const displayName = session?.user.name || session?.user.email || "";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3 lg:px-8">
        <NavLink to="/" aria-label="Medicore home" className="shrink-0">
          <Logo />
        </NavLink>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClassName}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {session && (
            <div className="hidden items-center gap-2.5 border-l border-line pl-3 md:flex">
              <Avatar name={displayName} size={32} />
              <div className="max-w-48">
                <p className="truncate font-display text-sm font-semibold text-ink">
                  {displayName}
                </p>
                {role && (
                  <p className="text-caption text-ink-subtle">{ROLE_LABELS[role] ?? role}</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                aria-label="Sign out"
                title="Sign out"
                className="rounded-control p-2 text-ink-subtle transition-colors hover:bg-surface-container hover:text-ink"
              >
                <LogOut aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsDrawerOpen((open) => !open)}
            aria-expanded={isDrawerOpen}
            aria-controls="mobile-nav"
            aria-label={isDrawerOpen ? "Close menu" : "Open menu"}
            className="rounded-control p-2 text-ink transition-colors hover:bg-surface-container md:hidden"
          >
            {isDrawerOpen ? (
              <X aria-hidden="true" className="h-5 w-5" />
            ) : (
              <Menu aria-hidden="true" className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {isDrawerOpen && (
        <nav
          id="mobile-nav"
          aria-label="Main"
          className="border-t border-line bg-white px-6 py-3 md:hidden"
        >
          <div className="flex flex-col gap-1">
            {items.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={drawerLinkClassName}>
                {item.label}
              </NavLink>
            ))}
          </div>
          {session && (
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <Avatar name={displayName} size={32} />
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-semibold text-ink">
                    {displayName}
                  </p>
                  {role && (
                    <p className="text-caption text-ink-subtle">{ROLE_LABELS[role] ?? role}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex shrink-0 items-center gap-1.5 rounded-control px-3 py-2 font-display text-sm font-semibold text-ink-muted transition-colors hover:bg-surface-container"
              >
                <LogOut aria-hidden="true" className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
