import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface PolicyLinkProps {
  to: string;
  children: ReactNode;
}

/**
 * A link to one of the legal documents, for use inside consent text.
 *
 * Two details that consent checkboxes get wrong everywhere:
 *
 *  - It opens in a new tab. These links live inside long forms, and sending
 *    someone away to read a policy mid-registration would cost them the
 *    answers they had already typed.
 *  - It stops the click from reaching the surrounding <label>. A link inside
 *    a label otherwise toggles the checkbox on the way out, so reading the
 *    policy would silently record — or withdraw — the consent it explains.
 */
export function PolicyLink({ to, children }: PolicyLinkProps) {
  return (
    <Link
      to={to}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => event.stopPropagation()}
      className="font-semibold text-primary underline underline-offset-4 hover:text-primary-hover"
    >
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </Link>
  );
}
