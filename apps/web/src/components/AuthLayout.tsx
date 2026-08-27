import { HeartPulse } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface AuthLayoutProps {
  children: ReactNode;
  wide?: boolean;
}

export function AuthLayout({ children, wide = false }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="flex w-full flex-col justify-center px-6 py-10 md:w-1/2 md:px-16">
        <div className={`mx-auto w-full ${wide ? "max-w-2xl" : "max-w-sm"}`}>
          <Link
            to="/"
            className="mb-8 flex items-center gap-2 text-lg font-semibold text-slate-900"
          >
            <HeartPulse className="h-6 w-6" />
            Healthcare
          </Link>
          {children}
        </div>
      </div>
      <div className="relative hidden flex-1 items-center justify-center bg-linear-to-br from-slate-800 to-slate-950 md:flex">
        <HeartPulse className="h-32 w-32 text-white/10" />
      </div>
    </div>
  );
}
