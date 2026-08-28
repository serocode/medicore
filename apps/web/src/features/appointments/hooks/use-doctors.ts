import { apiFetch } from "@/shared/lib/api-client";
import { useEffect, useState } from "react";

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  imageUrl: string | null;
}

interface DoctorsState {
  data: Doctor[] | null;
  error: string | null;
  isLoading: boolean;
}

export function useDoctors(): DoctorsState {
  const [state, setState] = useState<DoctorsState>({ data: null, error: null, isLoading: true });

  useEffect(() => {
    let cancelled = false;

    apiFetch<{ doctors: Doctor[] }>("/api/doctors")
      .then((result) => {
        if (!cancelled) setState({ data: result.doctors, error: null, isLoading: false });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            data: null,
            error: error instanceof Error ? error.message : "Failed to load doctors",
            isLoading: false,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
