import { apiFetch } from "@/shared/lib/api-client";
import { useEffect, useState } from "react";

export type DemoRole = "admin" | "doctor" | "nurse" | "patient";

export interface DemoAccount {
  email: string;
  name: string;
  role: DemoRole;
  headline: string;
}

interface DemoStatus {
  enabled: boolean;
  otp?: string;
  accounts?: DemoAccount[];
}

/**
 * Whether the API is running with DEMO_MODE on, and which seeded accounts it
 * will accept. Asked of the server rather than read from a VITE_ flag so the
 * two halves can't disagree — a demo panel that offers a fixed code the API
 * isn't using would be worse than no panel at all. A failed request simply
 * means "not a demo": the sign-in page renders exactly as it always has.
 */
export function useDemoMode(): DemoStatus {
  const [status, setStatus] = useState<DemoStatus>({ enabled: false });

  useEffect(() => {
    let cancelled = false;
    apiFetch<DemoStatus>("/api/demo")
      .then((result) => {
        if (!cancelled) setStatus(result);
      })
      .catch(() => {
        // Non-fatal by design — see above.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
