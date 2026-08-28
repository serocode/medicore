import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { Link, type LinkProps } from "react-router-dom";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover shadow-ambient",
  secondary: "bg-white text-ink border border-line hover:border-primary hover:text-primary",
  danger: "bg-danger text-white hover:bg-danger/90 shadow-ambient",
  ghost: "text-ink-muted hover:bg-surface-container hover:text-ink",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2.5 text-sm gap-2",
  lg: "px-6 py-3 text-base gap-2",
};

// Shared so <Button> and <ButtonLink> can never drift apart — a link that
// looks like a button must be styled by the same code that styles buttons.
export function buttonClassName(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className = "",
): string {
  return [
    // whitespace-nowrap: a button label that wraps to two lines reads as a
    // layout bug, and every label here is short enough not to need it.
    "inline-flex items-center justify-center whitespace-nowrap rounded-control font-display font-semibold",
    "transition-colors active:scale-[0.98] motion-reduce:active:scale-100",
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className,
  ].join(" ");
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return <button type={type} className={buttonClassName(variant, size, className)} {...props} />;
}

interface ButtonLinkProps extends Omit<LinkProps, "className"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

/**
 * A router link that renders as a button. Use this — never a hand-rolled
 * `<Link className="rounded-md bg-…">` — so navigation actions and form
 * actions share one visual language.
 */
export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonLinkProps) {
  return <Link className={buttonClassName(variant, size, className)} {...props} />;
}

interface ExternalButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/** The same treatment for a plain `<a>` — used for the lab report download. */
export function ExternalButtonLink({
  variant = "secondary",
  size = "md",
  className = "",
  ...props
}: ExternalButtonLinkProps) {
  return <a className={buttonClassName(variant, size, className)} {...props} />;
}
