import type { FieldValues, UseFormRegister } from "react-hook-form";
import { Field, TextInput, Textarea } from "./Field";

// Loosely typed (RHF's own composition escape hatch) so this can be embedded
// in any parent form whose schema includes these field names.
interface VitalsFormProps {
  register: UseFormRegister<FieldValues>;
}

export function VitalsForm({ register }: VitalsFormProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Field label="Blood pressure — systolic (mmHg)" htmlFor="bpSystolic">
        <TextInput
          id="bpSystolic"
          type="number"
          min={40}
          max={260}
          placeholder="120"
          {...register("bpSystolic")}
        />
      </Field>
      <Field label="Blood pressure — diastolic (mmHg)" htmlFor="bpDiastolic">
        <TextInput
          id="bpDiastolic"
          type="number"
          min={20}
          max={200}
          placeholder="80"
          {...register("bpDiastolic")}
        />
      </Field>
      <Field label="Heart rate (bpm)" htmlFor="heartRate">
        <TextInput
          id="heartRate"
          type="number"
          min={20}
          max={300}
          placeholder="76"
          {...register("heartRate")}
        />
      </Field>
      <Field label="Respiratory rate (/min)" htmlFor="respiratoryRate">
        <TextInput
          id="respiratoryRate"
          type="number"
          min={4}
          max={60}
          placeholder="18"
          {...register("respiratoryRate")}
        />
      </Field>
      <Field label="Temperature (°C)" htmlFor="temperatureCelsius">
        <TextInput
          id="temperatureCelsius"
          type="number"
          step="0.1"
          min={25}
          max={45}
          placeholder="36.7"
          {...register("temperatureCelsius")}
        />
      </Field>
      <Field label="SpO₂ (%)" htmlFor="oxygenSaturation">
        <TextInput
          id="oxygenSaturation"
          type="number"
          min={0}
          max={100}
          placeholder="98"
          {...register("oxygenSaturation")}
        />
      </Field>
      <Field label="Weight (kg)" htmlFor="weightKg">
        <TextInput
          id="weightKg"
          type="number"
          step="0.1"
          min={0.5}
          max={500}
          placeholder="65"
          {...register("weightKg")}
        />
      </Field>
      <Field label="Height (cm)" htmlFor="heightCm">
        <TextInput
          id="heightCm"
          type="number"
          step="0.1"
          min={20}
          max={300}
          placeholder="170"
          {...register("heightCm")}
        />
      </Field>
      <div className="sm:col-span-3">
        <Field label="Vitals notes" htmlFor="vitalsNotes">
          <Textarea id="vitalsNotes" {...register("vitalsNotes")} />
        </Field>
      </div>
    </div>
  );
}
