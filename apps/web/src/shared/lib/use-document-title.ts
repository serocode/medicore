import { useEffect } from "react";

const SUFFIX = "Medicore";

/**
 * Names the page in the browser tab, the window switcher, and the browser
 * history.
 *
 * A single-page app keeps whatever title index.html shipped with unless
 * something changes it, so every route here used to announce itself as
 * "Medicore" — the one thing a screen reader reads on arrival, and the label
 * on every entry in a user's history (WCAG 2.4.2). <PageHeader> calls this
 * with the heading it is already rendering, so most pages get it for free;
 * pages with their own header call it directly.
 *
 * Passing `undefined` (a heading still loading) leaves the current title
 * alone rather than flashing the bare product name.
 */
export function useDocumentTitle(title: string | undefined): void {
  useEffect(() => {
    if (!title) return;
    const previous = document.title;
    document.title = `${title} · ${SUFFIX}`;
    // Restoring on unmount matters for the back button: without it a page
    // that unmounts without a replacement leaves a stale name behind.
    return () => {
      document.title = previous;
    };
  }, [title]);
}
