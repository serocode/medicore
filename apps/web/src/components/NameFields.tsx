import { User as UserIcon } from "lucide-react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { NAME_SUFFIXES } from "../lib/types";
import { Field, Select, TextInput } from "./Field";

/** The shape any form using these fields must include. */
export interface NameFieldValues {
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
}

interface NameFieldsProps {
  // Loosely typed for the same reason VitalsForm is: this is a sub-form shared
  // by two parents with different overall schemas.
  register: UseFormRegister<never>;
  errors: FieldErrors<NameFieldValues>;
}

/**
 * First / middle / surname / suffix, used identically on registration and on
 * the account page so a name is captured and edited the same way in both.
 */
export function NameFields({ register, errors }: NameFieldsProps) {
  const field = register as unknown as UseFormRegister<NameFieldValues>;

  return (
    <div className="grid gap-4 sm:grid-cols-6">
      <div className="sm:col-span-2">
        <Field label="First name" htmlFor="firstName" error={errors.firstName?.message} required>
          <TextInput
            id="firstName"
            icon={UserIcon}
            autoComplete="given-name"
            {...field("firstName")}
          />
        </Field>
      </div>

      <div className="sm:col-span-2">
        {/* "(optional)" sits in the label rather than a hint line: a hint
            adds a row and knocks this field's input out of line with its
            neighbours, which have none. */}
        <Field
          label="Middle name (optional)"
          htmlFor="middleName"
          error={errors.middleName?.message}
        >
          <TextInput id="middleName" autoComplete="additional-name" {...field("middleName")} />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Field label="Surname" htmlFor="lastName" error={errors.lastName?.message} required>
          <TextInput id="lastName" autoComplete="family-name" {...field("lastName")} />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Field label="Suffix (optional)" htmlFor="suffix" error={errors.suffix?.message}>
          <Select id="suffix" autoComplete="honorific-suffix" {...field("suffix")}>
            <option value="">None</option>
            {NAME_SUFFIXES.map((suffix) => (
              <option key={suffix} value={suffix}>
                {suffix}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </div>
  );
}
