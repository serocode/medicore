import type { ReactNode } from "react";
import { NavBar } from "./NavBar";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      {children}
    </div>
  );
}
