import { apiFetch } from "@/shared/lib/api-client";
import type { LabTestCatalogItem } from "@/shared/lib/types";
import { useEffect, useState } from "react";

interface LabTestCatalogState {
  data: LabTestCatalogItem[] | null;
  isLoading: boolean;
  error: string | null;
}

export function useLabTestCatalog(): LabTestCatalogState {
  const [state, setState] = useState<LabTestCatalogState>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    apiFetch<{ catalog: LabTestCatalogItem[] }>("/api/lab-test-catalog")
      .then((result) => {
        if (!cancelled) setState({ data: result.catalog, isLoading: false, error: null });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          data: null,
          isLoading: false,
          error: error instanceof Error ? error.message : "Failed to load test catalog",
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
