import { useCallback, useEffect, useState } from "react";
import { ApiError, apiFetch } from "./api-client";
import type { Patient } from "./types";

interface PatientProfileState {
  data: Patient | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UsePatientProfileOptions {
  /**
   * Skip the request entirely. Staff and administrators have no patient
   * record, so fetching one for them is a guaranteed 404 on every page load —
   * noise in the console and a wasted round trip.
   */
  enabled?: boolean;
}

interface InternalState {
  data: Patient | null;
  error: string | null;
  /**
   * Which `enabled` value the data above was settled for, or null before the
   * first settle. Comparing it against the current `enabled` is what makes
   * `isLoading` correct on the render where `enabled` flips: the effect that
   * starts the fetch hasn't run yet, and reporting "not loading, no patient"
   * in that gap would send a registered patient to the registration form.
   */
  settledFor: boolean | null;
}

// A 404 means "not registered yet" — an expected state for a logged-in
// patient, not a failure — so it resolves to `data: null`, not `error`.
export function usePatientProfile({
  enabled = true,
}: UsePatientProfileOptions = {}): PatientProfileState {
  const [state, setState] = useState<InternalState>({
    data: null,
    error: null,
    settledFor: null,
  });

  const load = useCallback(() => {
    if (!enabled) {
      setState({ data: null, error: null, settledFor: false });
      return;
    }

    let cancelled = false;

    apiFetch<{ patient: Patient }>("/api/patients/me")
      .then((result) => {
        if (!cancelled) setState({ data: result.patient, error: null, settledFor: true });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 404) {
          setState({ data: null, error: null, settledFor: true });
          return;
        }
        setState({
          data: null,
          error: error instanceof Error ? error.message : "Failed to load profile",
          settledFor: true,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => load(), [load]);

  return {
    data: state.data,
    error: state.error,
    isLoading: state.settledFor !== enabled,
    refetch: load,
  };
}
