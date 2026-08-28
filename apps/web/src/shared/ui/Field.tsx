import type { LucideIcon } from "lucide-react";
import {
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  cloneElement,
  forwardRef,
  isValidElement,
} from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

const controlBase =
  "w-full rounded-control border bg-surface-low px-3 py-2.5 text-sm text-ink transition-colors placeholder:text-ink-subtle focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-surface-container disabled:text-ink-subtle";
const controlIdle = "border-line focus:border-primary focus:ring-accent-soft-dim";
const controlInvalid = "border-danger focus:border-danger focus:ring-danger-soft";

export const inputClassName = `${controlBase} ${controlIdle}`;

// Shell for controls that carry a leading icon. The ring lives on the shell so
// the icon sits inside the focus treatment rather than beside it.
const shellBase =
  "flex items-center gap-2 rounded-control border bg-surface-low px-3 transition-colors focus-within:ring-2";
const shellIdle = "border-line focus-within:border-primary focus-within:ring-accent-soft-dim";
const shellInvalid = "border-danger focus-within:border-danger focus-within:ring-danger-soft";
const borderlessClassName =
  "w-full border-0 bg-transparent py-2.5 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:text-ink-subtle";

function controlStateClasses(invalid: boolean): string {
  return invalid ? controlInvalid : controlIdle;
}

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  /** Marks the field required — see <RequiredLegend> for the shared convention. */
  required?: boolean;
  /** Guidance shown under the label, before the user submits anything. */
  hint?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, error, required, hint, children }: FieldProps) {
  const errorId = `${htmlFor}-error`;
  const hintId = `${htmlFor}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ");

  // Wires the error and required state onto whatever input this Field wraps —
  // every caller gets aria-invalid/aria-describedby/aria-required for free
  // instead of needing to pass them through by hand at each call site.
  // `aria-required` rather than the native `required` attribute keeps Zod the
  // single source of validation; the browser's own bubble would pre-empt it.
  const content = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy || undefined,
        "aria-required": required ? true : undefined,
        "data-invalid": error ? "true" : undefined,
      })
    : children;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="font-display text-sm font-semibold text-ink">
        {label}
        {required && (
          <>
            <span aria-hidden="true" className="ml-0.5 text-danger">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        )}
      </label>
      {hint && (
        <p id={hintId} className="text-caption text-ink-subtle">
          {hint}
        </p>
      )}
      {content}
      {error && (
        <p id={errorId} role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * The legend that makes the `*` convention understandable before a user has
 * submitted anything. Put one at the top of every form that has required
 * fields.
 */
export function RequiredLegend({ className = "" }: { className?: string }) {
  return (
    <p className={`text-caption text-ink-subtle ${className}`}>
      Fields marked{" "}
      <span aria-hidden="true" className="text-danger">
        *
      </span>
      <span className="sr-only">with an asterisk</span> are required.
    </p>
  );
}

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { icon: Icon, className = "", ...props },
  ref,
) {
  const invalid = props["aria-invalid"] === true;

  if (!Icon) {
    return (
      <input
        ref={ref}
        className={`${controlBase} ${controlStateClasses(invalid)} ${className}`}
        {...props}
      />
    );
  }

  return (
    <div className={`${shellBase} ${invalid ? shellInvalid : shellIdle}`}>
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-subtle" />
      <input ref={ref} className={`${borderlessClassName} ${className}`} {...props} />
    </div>
  );
});

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  icon?: LucideIcon;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { icon: Icon, className = "", children, ...props },
  ref,
) {
  const invalid = props["aria-invalid"] === true;

  if (!Icon) {
    return (
      <select
        ref={ref}
        className={`${controlBase} ${controlStateClasses(invalid)} ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  }

  return (
    <div className={`${shellBase} ${invalid ? shellInvalid : shellIdle}`}>
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-subtle" />
      <select ref={ref} className={`${borderlessClassName} ${className}`} {...props}>
        {children}
      </select>
    </div>
  );
});

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className = "", rows = 3, ...props },
  ref,
) {
  const invalid = props["aria-invalid"] === true;
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`${controlBase} ${controlStateClasses(invalid)} ${className}`}
      {...props}
    />
  );
});

interface CheckboxFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
}

export const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(
  function CheckboxField({ label, id, className = "", ...props }, ref) {
    return (
      <label
        htmlFor={id}
        className="flex cursor-pointer items-start gap-2.5 text-sm text-ink-muted"
      >
        <input
          ref={ref}
          id={id}
          type="checkbox"
          className={`mt-0.5 h-4 w-4 shrink-0 rounded-sm accent-primary ${className}`}
          {...props}
        />
        <span>{label}</span>
      </label>
    );
  },
);

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupFieldProps {
  options: RadioOption[];
  registerProps: UseFormRegisterReturn;
}

export function RadioGroupField({ options, registerProps }: RadioGroupFieldProps) {
  return (
    <div className="flex h-full flex-wrap items-center gap-x-5 gap-y-2 rounded-control border border-line bg-surface-low px-3 py-2.5">
      {options.map((option) => (
        <label
          key={option.value}
          className="flex cursor-pointer items-center gap-2 text-sm text-ink-muted"
        >
          <input
            type="radio"
            value={option.value}
            className="h-4 w-4 accent-primary"
            {...registerProps}
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}
