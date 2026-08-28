interface LogoProps {
  /** `sm` for the nav bar, `md` for the sign-in page and footer. */
  size?: "sm" | "md";
  /** Render the mark alone — for tight spots where the wordmark won't fit. */
  markOnly?: boolean;
  /** Inverts the wordmark for use on the dark panel. */
  inverse?: boolean;
}

const MARK_SIZE = { sm: "h-8 w-8", md: "h-10 w-10" } as const;
const WORD_SIZE = { sm: "text-lg", md: "text-xl" } as const;

/**
 * The Medicore mark: a single pulse trace. A medical cross would say
 * "healthcare" generically; the trace says vital signs, which is what the
 * record in this product is actually built around. Deliberately one bold
 * stroke so it survives down to the 20px nav size.
 */
export function Logo({ size = "sm", markOnly = false, inverse = false }: LogoProps) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className={`flex shrink-0 items-center justify-center rounded-control bg-primary ${MARK_SIZE[size]}`}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          aria-hidden="true"
          className={size === "sm" ? "h-5 w-5" : "h-6 w-6"}
        >
          <path
            d="M3 18h4.5L12 8l5 16 3.5-9 2 3H29"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {!markOnly && (
        <span
          className={`font-display font-bold tracking-tight ${WORD_SIZE[size]} ${
            inverse ? "text-on-inverse" : "text-ink"
          }`}
        >
          Medicore
        </span>
      )}
    </span>
  );
}
