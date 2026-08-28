import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { NavBar } from "./NavBar";

interface LayoutProps {
  children: ReactNode;
  /**
   * `wide` is the 1280px working surface for dashboards and records;
   * `narrow` is the reading-width column that long forms live in.
   */
  width?: "wide" | "narrow";
}

const WIDTH_CLASSES = { wide: "max-w-7xl", narrow: "max-w-3xl" } as const;

/**
 * The authenticated app shell. Owns the single <main> landmark — pages render
 * their content, not their own page chrome.
 */
export function Layout({ children, width = "wide" }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <a
        href="#main"
        className="skip-link absolute left-4 top-4 z-50 rounded-control bg-primary px-4 py-2 font-display text-sm font-semibold text-on-primary"
      >
        Skip to content
      </a>
      <NavBar />
      <main id="main" className="flex-1">
        <div
          className={`mx-auto flex w-full flex-col gap-6 px-6 py-8 lg:px-8 lg:py-12 ${WIDTH_CLASSES[width]}`}
        >
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
