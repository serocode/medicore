import { useCallback, useEffect, useState } from "react";
import { ApiError, apiFetch } from "./api-client";
import type { Patient } from "./types";

interface PatientProfileState {
  data: Patient | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// A 404 means "not registered yet" — an expected state for a logged-in
// patient, not a failure — so it resolves to `data: null`, not `error`.
export function usePatientProfile(): PatientProfileState {
  const [state, setState] = useState<Omit<PatientProfileState, "refetch">>({
    data: null,
    isLoading: true,
    error: null,
  });

  const load = useCallback(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, isLoading: true }));

    apiFetch<{ patient: Patient }>("/api/patients/me")
      .then((result) => {
        if (!cancelled) setState({ data: result.patient, isLoading: false, error: null });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 404) {
          setState({ data: null, isLoading: false, error: null });
          return;
        }
        setState({
          data: null,
          isLoading: false,
          error: error instanceof Error ? error.message : "Failed to load profile",
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => load(), [load]);

  return { ...state, refetch: load };
}
