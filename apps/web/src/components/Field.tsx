import type { LucideIcon } from "lucide-react";
import {
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  forwardRef,
} from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

export const inputClassName =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

const shellClassName =
  "flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 focus-within:border-slate-500 focus-within:ring-1 focus-within:ring-slate-500";
const borderlessClassName =
  "w-full border-0 bg-transparent py-2 text-sm focus:outline-none focus:ring-0 disabled:text-slate-400";

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { icon: Icon, className = "", ...props },
  ref,
) {
  return (
    <div className={shellClassName}>
      {Icon && <Icon className="h-4 w-4 shrink-0 text-slate-400" />}
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
  return (
    <div className={shellClassName}>
      {Icon && <Icon className="h-4 w-4 shrink-0 text-slate-400" />}
      <select ref={ref} className={`${borderlessClassName} ${className}`} {...props}>
        {children}
      </select>
    </div>
  );
});

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className = "", ...props },
  ref,
) {
  return <textarea ref={ref} className={`${inputClassName} ${className}`} {...props} />;
});

interface CheckboxFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
}

export const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(
  function CheckboxField({ label, id, className = "", ...props }, ref) {
    return (
      <label htmlFor={id} className="flex items-start gap-2 text-sm text-slate-700">
        <input ref={ref} id={id} type="checkbox" className={`mt-1 ${className}`} {...props} />
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
    <div className="flex h-full items-center gap-4 rounded-md border border-slate-300 bg-white px-3 py-2">
      {options.map((option) => (
        <label key={option.value} className="flex items-center gap-2 text-sm text-slate-700">
          <input type="radio" value={option.value} className="h-4 w-4" {...registerProps} />
          {option.label}
        </label>
      ))}
    </div>
  );
}
