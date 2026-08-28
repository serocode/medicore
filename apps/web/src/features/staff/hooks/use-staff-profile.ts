import { ApiError, apiFetch } from "@/shared/lib/api-client";
import type { StaffProfile } from "@/shared/lib/types";
import { useEffect, useState } from "react";

interface StaffProfileState {
  data: StaffProfile | null;
  isLoading: boolean;
  error: string | null;
}

// A 403/404 means "not staff" or "no profile yet" — treated as `data: null`
// rather than an error, mirroring usePatientProfile's convention.
export function useStaffProfile(): StaffProfileState {
  const [state, setState] = useState<StaffProfileState>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    apiFetch<StaffProfile>("/api/staff/me")
      .then((profile) => {
        if (!cancelled) setState({ data: profile, isLoading: false, error: null });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
          setState({ data: null, isLoading: false, error: null });
          return;
        }
        setState({
          data: null,
          isLoading: false,
          error: error instanceof Error ? error.message : "Failed to load staff profile",
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
