import { useEffect, useState } from "react";
import { apiFetch } from "./api-client";
import { displayName } from "./format";

/**
 * Just the patient's name, for breadcrumb trails on the clinical sub-pages
 * (record an encounter, request a test, view a result). Those pages know the
 * patient id from the route but not the name, and a trail reading
 * "Dashboard / Patient / New encounter" is far less use to a clinician than
 * one naming the person whose record they're writing into.
 *
 * Resolves to null rather than an error — a missing name must never stop the
 * page it decorates from rendering.
 */
export function usePatientName(patientId: string | undefined): string | null {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;

    apiFetch<{ name: string }>(`/api/patients/${patientId}`)
      .then((result) => {
        if (!cancelled) setName(displayName(result.name));
      })
      .catch(() => {
        if (!cancelled) setName(null);
      });

    return () => {
      cancelled = true;
    };
  }, [patientId]);

  return name;
}
