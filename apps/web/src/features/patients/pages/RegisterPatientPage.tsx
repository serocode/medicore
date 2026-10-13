import { NameFields } from "@/features/patients/components/NameFields";
import {
  ConsentFields,
  EmergencyContactFields,
  PersonalDetailsFields,
  patientDetailsSchema,
} from "@/features/patients/components/patient-fields";
import { apiFetch, apiFetchForm, applyApiErrorToForm } from "@/shared/lib/api-client";
import { useSession } from "@/shared/lib/auth-client";
import { MAX_LINE_TEXT } from "@/shared/lib/constants";
import { useDocumentTitle } from "@/shared/lib/use-document-title";
import { Button } from "@/shared/ui/Button";
import { RequiredLegend } from "@/shared/ui/Field";
import { StatusMessage } from "@/shared/ui/StatusMessage";
import { UnsavedChangesGuard } from "@/shared/ui/UnsavedChangesGuard";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { type FieldPath, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

const nameSchema = z.object({
  firstName: z.string().min(1, "Required").max(MAX_LINE_TEXT, "That's too long"),
  middleName: z.string().max(MAX_LINE_TEXT, "That's too long").optional(),
  lastName: z.string().min(1, "Required").max(MAX_LINE_TEXT, "That's too long"),
  suffix: z.string().optional(),
});

// Only what the clinic can't do without. Physician, insurance, medical history
// and identification are all optional on the record and live on the account
// page, where the patient can add them once they're signed up.
const registerSchema = nameSchema.extend(
  patientDetailsSchema.pick({
    birthDate: true,
    gender: true,
    address: true,
    occupation: true,
    emergencyContactName: true,
    emergencyContactPhone: true,
    consentTreatment: true,
    consentDisclosure: true,
    consentPrivacy: true,
  }).shape,
);
type RegisterValues = z.infer<typeof registerSchema>;

/**
 * Registration is a sequence, not a wall.
 *
 * A note on what this page is: the *account* already exists by the time
 * someone arrives here — Medicore has no passwords, and signing in with a
 * one-time code is what creates it. This step captures the minimum the clinic
 * needs before a first visit — who you are, someone to call in an emergency,
 * and consent to treatment — in two short steps. Everything else is optional
 * and is added later from the account page.
 */
const STEPS = [
  {
    id: "about-you",
    title: "About you",
    blurb: "Who you are and how to reach someone if there's an emergency.",
    fields: [
      "firstName",
      "middleName",
      "lastName",
      "suffix",
      "birthDate",
      "gender",
      "address",
      "occupation",
      "emergencyContactName",
      "emergencyContactPhone",
    ],
  },
  {
    id: "consent",
    title: "Consent",
    blurb: "Your agreement to be treated, and to how your information is handled.",
    fields: ["consentTreatment", "consentDisclosure", "consentPrivacy"],
  },
] as const satisfies ReadonlyArray<{
  id: string;
  title: string;
  blurb: string;
  fields: ReadonlyArray<FieldPath<RegisterValues>>;
}>;

export function RegisterPatientPage() {
  useDocumentTitle("Register");
  const navigate = useNavigate();
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const isFirstStepRender = useRef(true);
  const { data: session } = useSession();
  const [stepIndex, setStepIndex] = useState(0);
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);
  // Set once the record is safely saved. Navigating straight from inside the
  // submit handler ran while the form was still dirty and `isSubmitSuccessful`
  // hadn't flipped yet, so the unsaved-changes guard blocked the redirect and
  // registration appeared to do nothing. Flipping this first renders the guard
  // disabled, and the effect below then navigates.
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    if (isRegistered) navigate("/book");
  }, [isRegistered, navigate]);

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    setError,
    formState: { errors, isSubmitting, isDirty, isSubmitSuccessful },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    values: {
      firstName: "",
      middleName: "",
      lastName: "",
      suffix: "",
      birthDate: "",
      gender: "other",
      address: "",
      occupation: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      consentTreatment: false,
      consentDisclosure: false,
      consentPrivacy: false,
    },
  });

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  // Changing step swaps the whole panel out without moving the page or the
  // caret, so a keyboard or screen-reader user was left focused on a button
  // that had just been replaced, with no announcement of where they now were.
  // Focusing the new step's heading puts them at the top of the content that
  // changed — and makes the "we've taken you back" message actually land.
  // Skipped on first render, which would otherwise steal focus on arrival.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the step index is the signal, not a value the effect reads.
  useEffect(() => {
    if (isFirstStepRender.current) {
      isFirstStepRender.current = false;
      return;
    }
    stepHeadingRef.current?.focus();
  }, [stepIndex]);

  /**
   * Advance only when *this step's* fields are clean.
   *
   * `trigger`'s own return value can't be used: with a whole-form resolver it
   * reflects the entire schema, and the consent boxes on the last step are
   * legitimately unticked while someone is still on step one. So `trigger`
   * runs for its side effect of rendering the messages, and the decision is
   * made by parsing the current values against just this step's keys.
   */
  async function goNext() {
    const fields = [...(step?.fields ?? [])];
    await trigger(fields);

    const stepSchema = z.object(
      Object.fromEntries(fields.map((field) => [field, registerSchema.shape[field]])),
    );
    if (stepSchema.safeParse(getValues()).success) {
      setStepIndex((index) => Math.min(index + 1, STEPS.length - 1));
    }
  }

  async function submit(values: RegisterValues) {
    setSubmitError(undefined);

    try {
      // Name first: it lives on the account, not the patient record, and is
      // the one part that stays useful even if the intake below is rejected.
      await apiFetch("/api/account/me", {
        method: "PATCH",
        body: JSON.stringify({
          firstName: values.firstName,
          middleName: values.middleName || undefined,
          lastName: values.lastName,
          suffix: values.suffix || undefined,
        }),
      });

      const formData = new FormData();
      for (const [key, value] of Object.entries(values)) {
        if (["firstName", "middleName", "lastName", "suffix"].includes(key)) continue;
        formData.append(key, typeof value === "boolean" ? String(value) : (value ?? ""));
      }
      await apiFetchForm("/api/patients/register", formData);

      setIsRegistered(true);
    } catch (error) {
      applyApiErrorToForm(error, setError);
      setSubmitError(
        error instanceof Error ? error.message : "We couldn't complete your registration.",
      );
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 py-4">
      <UnsavedChangesGuard when={isDirty && !isSubmitSuccessful && !isRegistered} />

      <header className="text-center">
        <p className="font-display text-label uppercase text-primary">Welcome to Medicore</p>
        <h1 className="mt-3 text-headline-lg text-ink">Let's get you registered</h1>
        <p className="mx-auto mt-3 max-w-md text-ink-muted">
          Signed in as {session?.user.email}. Your care team needs a few details before your first
          visit — it takes about a minute. Medical history, insurance, and ID can be added later
          from your account.
        </p>
      </header>

      {/* Progress. Numbered because these steps are a real sequence: you
          cannot consent before you have said who you are. */}
      <ol className="flex items-center gap-2" aria-label="Registration progress">
        {STEPS.map((item, index) => {
          const isDone = index < stepIndex;
          const isCurrent = index === stepIndex;
          return (
            <li key={item.id} className="flex flex-1 flex-col gap-2">
              <span
                aria-hidden="true"
                className={`h-1.5 rounded-full ${
                  isDone || isCurrent ? "bg-primary" : "bg-surface-container"
                }`}
              />
              <span
                className={`flex items-center gap-1.5 text-caption ${
                  isCurrent ? "font-semibold text-ink" : "text-ink-subtle"
                }`}
              >
                {isDone ? (
                  <Check aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <span className="tabular-nums">{index + 1}.</span>
                )}
                {item.title}
                {isCurrent && <span className="sr-only"> (current step)</span>}
              </span>
            </li>
          );
        })}
      </ol>

      <form
        onSubmit={handleSubmit(submit, (invalid) => {
          // Something on an earlier step is wrong. Without this the submit
          // silently did nothing, because the offending field isn't rendered.
          const names = Object.keys(invalid);
          const stepWithError = STEPS.findIndex((s) => s.fields.some((f) => names.includes(f)));
          if (stepWithError >= 0) setStepIndex(stepWithError);
          setSubmitError(
            "Some details need fixing — we've taken you back to the step that needs attention.",
          );
        })}
        className="flex flex-col gap-6"
      >
        <div className="rounded-card border border-line bg-white p-6 shadow-ambient sm:p-8">
          {/* tabIndex -1: focusable by script (see the effect above) but not
              in the tab order. Programmatic focus doesn't match
              :focus-visible, so no stray outline appears. */}
          <h2 ref={stepHeadingRef} tabIndex={-1} className="text-headline-sm text-ink">
            {step?.title}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">{step?.blurb}</p>
          <RequiredLegend className="mt-3" />

          <div className="mt-6 flex flex-col gap-6">
            {stepIndex === 0 && (
              <>
                <NameFields register={register as never} errors={errors} />
                <PersonalDetailsFields
                  register={register as never}
                  errors={errors}
                  genderRegister={register("gender")}
                />
                <EmergencyContactFields register={register as never} errors={errors} />
              </>
            )}

            {stepIndex === 1 && <ConsentFields register={register as never} errors={errors} />}
          </div>
        </div>

        {submitError && <StatusMessage tone="error">{submitError}</StatusMessage>}

        <div className="flex items-center justify-between gap-3">
          {stepIndex > 0 ? (
            <Button variant="secondary" onClick={() => setStepIndex((index) => index - 1)}>
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              Back
            </Button>
          ) : (
            <span />
          )}

          {isLastStep ? (
            /* The `key` matters. Without distinct keys React reuses the same
               <button> across this ternary and merely patches `type`, so the
               click that advanced to the last step had its default action
               evaluated against an element that had become type="submit" —
               firing a phantom submit and leaving isSubmitting stuck on. */
            <Button key="finish" type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Creating your record…" : "Complete registration"}
            </Button>
          ) : (
            <Button key="continue" size="lg" onClick={goNext}>
              Continue
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
