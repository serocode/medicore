import { ButtonLink } from "../components/Button";
import { Logo } from "../components/Logo";

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-surface px-6 py-12 text-center">
      <Logo size="md" />
      <div>
        <p className="font-display text-label uppercase text-ink-subtle">Error 404</p>
        <h1 className="mt-2 text-headline-lg text-ink">We couldn't find that page</h1>
        <p className="mt-2 max-w-md text-ink-muted">
          The link may be out of date, or the record may have been removed.
        </p>
      </div>
      <ButtonLink to="/">Go to the home page</ButtonLink>
    </main>
  );
}
