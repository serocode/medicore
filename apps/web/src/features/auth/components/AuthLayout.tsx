import { Logo } from "@/shared/ui/Logo";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

/**
 * The signed-out shell, used only by the sign-in page. In-app forms belong in
 * <Layout width="narrow"> — they need the product navigation, not a landing
 * panel.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface">
      <div className="flex w-full flex-col justify-center px-6 py-12 md:w-1/2 md:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/" aria-label="Medicore home" className="mb-10 inline-block">
            <Logo size="md" />
          </Link>
          {children}
        </div>
      </div>

      <div
        aria-hidden="true"
        className="relative hidden flex-1 flex-col justify-end overflow-hidden bg-primary p-16 md:flex"
      >
        {/* Ambient tonal wash — no imagery to license, no stock-photo clinic. */}
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary-muted/40" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-primary-muted/30" />
        <blockquote className="relative max-w-md">
          <p className="font-display text-2xl font-semibold leading-snug text-on-inverse">
            One record per patient — appointments, consultations, vitals, and laboratory results, in
            the order they happened.
          </p>
          <footer className="mt-4 text-sm text-primary-soft">Medicore</footer>
        </blockquote>
      </div>
    </div>
  );
}
