/**
 * Demo dataset — the clinic as it would look mid-week, so every screen has
 * something real to show: staff and patient accounts for each role, a mix of
 * appointment states, signed encounters with vitals to trend, and lab results
 * spread across the request → result → reviewed lifecycle.
 *
 * Re-runnable: each run deletes the rows it owns (identified by the demo
 * accounts in ./demo.ts) and rebuilds them, so relative dates stay fresh and
 * a demo that got poked at can be reset with one command. It only ever
 * touches demo-owned rows — real patients and their records are left alone,
 * and shared picklist rows (doctors, the lab test catalog) are upserted
 * rather than replaced.
 *
 *   pnpm db:seed:demo
 */
import { and, eq, inArray, or } from "drizzle-orm";
import { createDbClient } from "./client.js";
import { DEMO_ACCOUNTS, DEMO_OTP, type DemoAccount } from "./demo.js";
import { appointment } from "./schema/appointment.js";
import { user } from "./schema/auth.js";
import { doctor } from "./schema/doctor.js";
import { encounter } from "./schema/encounter.js";
import { labResult, labResultParameter, labTestCatalogItem } from "./schema/laboratory.js";
import { nurse } from "./schema/nurse.js";
import { patient } from "./schema/patient.js";
import { staffInvite } from "./schema/staff-invite.js";
import { vitalSign } from "./schema/vital-sign.js";
import { resolveDatabaseUrl } from "./seed-env.js";

const db = createDbClient(resolveDatabaseUrl());

// ---------------------------------------------------------------- utilities

const DAY_MS = 24 * 60 * 60 * 1000;

/** Clinic-local wall-clock time, so seeded appointments land on tidy hours. */
function daysFromNow(days: number, hour = 9, minute = 0): Date {
  const when = new Date(Date.now() + days * DAY_MS);
  when.setHours(hour, minute, 0, 0);
  return when;
}

const daysAgo = (days: number, hour = 9, minute = 0) => daysFromNow(-days, hour, minute);

/**
 * `returning()` types as an array, so every single-row insert would otherwise
 * need a null check the database has already made impossible.
 */
function first<T>(rows: T[], what: string): T {
  const [row] = rows;
  if (!row) throw new Error(`Failed to insert ${what}`);
  return row;
}

function account(email: string): DemoAccount {
  const found = DEMO_ACCOUNTS.find((entry) => entry.email === email);
  if (!found) throw new Error(`Unknown demo account: ${email}`);
  return found;
}

const ADMIN = account("admin@medicore.test");
const DR_CRUZ = account("dr.cruz@medicore.test");
const DR_UY = account("dr.uy@medicore.test");
const NURSE = account("nurse@medicore.test");
const SANTOS = account("maria.santos@medicore.test");
const DELA_CRUZ = account("jose.delacruz@medicore.test");
const LIM = account("ana.lim@medicore.test");

// ------------------------------------------------------------- reset (own rows only)

async function clearDemoData(): Promise<void> {
  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(
      inArray(
        user.email,
        DEMO_ACCOUNTS.map((entry) => entry.email),
      ),
    );
  // Union with the fixed ids so a half-written previous run is still cleaned
  // up, even if its user row lost its email somehow.
  const userIds = [
    ...new Set([...existing.map((row) => row.id), ...DEMO_ACCOUNTS.map((a) => a.id)]),
  ];

  const patients = await db
    .select({ id: patient.id })
    .from(patient)
    .where(inArray(patient.userId, userIds));
  const patientIds = patients.map((row) => row.id);

  // Deleted in foreign-key order, and scoped by *either* the demo patient or
  // the demo author: a staff account used during a demo may well have written
  // an encounter or requested a lab test against some other patient, and
  // those references are ON DELETE RESTRICT.
  const ownedLabResults = await db
    .select({ id: labResult.id })
    .from(labResult)
    .where(
      patientIds.length
        ? or(
            inArray(labResult.patientId, patientIds),
            inArray(labResult.requestedByUserId, userIds),
          )
        : inArray(labResult.requestedByUserId, userIds),
    );
  const labResultIds = ownedLabResults.map((row) => row.id);
  if (labResultIds.length) {
    await db
      .delete(labResultParameter)
      .where(inArray(labResultParameter.labResultId, labResultIds));
    await db.delete(labResult).where(inArray(labResult.id, labResultIds));
  }

  await db
    .delete(vitalSign)
    .where(
      patientIds.length
        ? or(inArray(vitalSign.patientId, patientIds), inArray(vitalSign.recordedByUserId, userIds))
        : inArray(vitalSign.recordedByUserId, userIds),
    );

  await db
    .delete(encounter)
    .where(
      patientIds.length
        ? or(inArray(encounter.patientId, patientIds), inArray(encounter.recordedByUserId, userIds))
        : inArray(encounter.recordedByUserId, userIds),
    );

  if (patientIds.length) {
    await db.delete(appointment).where(inArray(appointment.patientId, patientIds));
    await db.delete(patient).where(inArray(patient.id, patientIds));
  }

  await db.delete(nurse).where(inArray(nurse.userId, userIds));
  await db.delete(staffInvite).where(inArray(staffInvite.invitedByUserId, userIds));
  // Doctor rows are shared picklist data (real appointments may reference
  // them), so the account link is dropped rather than the row — which the
  // user delete below would do anyway via ON DELETE SET NULL.
  await db.update(doctor).set({ userId: null }).where(inArray(doctor.userId, userIds));
  await db.delete(user).where(inArray(user.id, userIds));
}

// ------------------------------------------------------------------- upserts

async function ensureUser(entry: DemoAccount, image: string | null = null): Promise<string> {
  await db.insert(user).values({
    id: entry.id,
    name: entry.name,
    firstName: entry.firstName,
    lastName: entry.lastName,
    email: entry.email,
    emailVerified: true,
    image,
    role: entry.role,
  });
  return entry.id;
}

type DoctorProfile = Omit<typeof doctor.$inferInsert, "id" | "createdAt">;

/** Upsert by name: the baseline seed already owns these five picklist rows. */
async function ensureDoctor(profile: DoctorProfile): Promise<string> {
  const [existing] = await db.select().from(doctor).where(eq(doctor.name, profile.name));
  if (existing) {
    await db.update(doctor).set(profile).where(eq(doctor.id, existing.id));
    return existing.id;
  }
  const created = first(
    await db.insert(doctor).values(profile).returning({ id: doctor.id }),
    `doctor ${profile.name}`,
  );
  return created.id;
}

type LabCategory = (typeof labTestCatalogItem.$inferInsert)["category"];

async function ensureCatalogItem(category: LabCategory, name: string): Promise<string> {
  const [existing] = await db
    .select()
    .from(labTestCatalogItem)
    .where(and(eq(labTestCatalogItem.category, category), eq(labTestCatalogItem.name, name)));
  if (existing) return existing.id;
  const created = first(
    await db.insert(labTestCatalogItem).values({ category, name }).returning({
      id: labTestCatalogItem.id,
    }),
    `lab test ${name}`,
  );
  return created.id;
}

// ---------------------------------------------------------------------- seed

console.log("Resetting demo data…");
await clearDemoData();

console.log("Seeding demo accounts…");
await ensureUser(ADMIN);
await ensureUser(DR_CRUZ);
await ensureUser(DR_UY);
await ensureUser(NURSE);
await ensureUser(SANTOS);
await ensureUser(DELA_CRUZ);
await ensureUser(LIM);

const cruzDoctorId = await ensureDoctor({
  userId: DR_CRUZ.id,
  name: DR_CRUZ.name,
  specialization: "Family Medicine",
  title: "MD, FPAFP",
  department: "Outpatient Clinic",
  licenseNumber: "PRC-0142887",
  contactPhone: "+63 2 8551 0142",
  bio: "Family physician with a focus on chronic disease management — diabetes, hypertension, and preventive care for working adults.",
  yearsOfExperience: 12,
  imageUrl: null,
});

const uyDoctorId = await ensureDoctor({
  userId: DR_UY.id,
  name: DR_UY.name,
  specialization: "Cardiology",
  title: "MD, FPCC",
  department: "Cardiology",
  licenseNumber: "PRC-0118904",
  contactPhone: "+63 2 8551 0177",
  bio: "Cardiologist handling referrals for chest pain, arrhythmia workups, and post-event follow-up.",
  yearsOfExperience: 18,
  imageUrl: null,
});

await db.insert(nurse).values({
  userId: NURSE.id,
  name: NURSE.name,
  title: "RN",
  department: "Outpatient Clinic",
  licenseNumber: "PRC-RN-338215",
  contactPhone: "+63 2 8551 0150",
  bio: "Triage and vitals for the outpatient clinic; handles lab report intake from the partner laboratory.",
  imageUrl: null,
});

console.log("Seeding demo patients…");

const santos = first(
  await db
    .insert(patient)
    .values({
      userId: SANTOS.id,
      birthDate: "1988-03-14",
      gender: "female",
      address: "18 Mabini Street, Barangay Poblacion, Makati City",
      occupation: "Secondary school teacher",
      emergencyContactName: "Rafael Santos (husband)",
      emergencyContactPhone: "+63 917 555 0142",
      primaryPhysicianId: cruzDoctorId,
      insuranceProvider: "PhilHealth",
      insurancePolicyNumber: "PH-2019-448210",
      allergies:
        "Penicillin — generalised rash and facial swelling (2016). Tolerates cephalosporins.",
      currentMedications: "Metformin 500 mg twice daily with meals\nLosartan 50 mg once daily",
      familyMedicalHistory:
        "Mother: type 2 diabetes, diagnosed at 52. Father: hypertension, myocardial infarction at 61.",
      pastMedicalHistory:
        "Type 2 diabetes mellitus, diagnosed 2021. Hypertension, diagnosed 2022. Caesarean section 2015, uncomplicated.",
      identificationType: "National Identity Card",
      identificationNumber: "PSN-8842-6610-2277",
      bloodType: "O+",
      consentTreatment: true,
      consentDisclosure: true,
      consentPrivacy: true,
    })
    .returning({ id: patient.id }),
  "santos",
);

const delaCruz = first(
  await db
    .insert(patient)
    .values({
      userId: DELA_CRUZ.id,
      birthDate: "1975-11-02",
      gender: "male",
      address: "Block 7 Lot 22, Greenfield Subdivision, Pasig City",
      occupation: "Delivery driver",
      emergencyContactName: "Lorna Dela Cruz (sister)",
      emergencyContactPhone: "+63 918 555 0993",
      primaryPhysicianId: uyDoctorId,
      insuranceProvider: "Maxicare",
      insurancePolicyNumber: "MX-77-2210948",
      allergies: "No known drug allergies.",
      currentMedications: "Amlodipine 10 mg once daily\nAtorvastatin 20 mg at bedtime",
      familyMedicalHistory: "Father: stroke at 66. Brother: hypertension.",
      pastMedicalHistory:
        "Hypertension since 2018, previously poorly controlled. Former smoker, quit 2020 (15 pack-years).",
      identificationType: "Driver's License",
      identificationNumber: "N02-88-114509",
      bloodType: "A+",
      consentTreatment: true,
      consentDisclosure: true,
      consentPrivacy: true,
    })
    .returning({ id: patient.id }),
  "delaCruz",
);

// Deliberately left with no visits, appointments, or labs — the empty states
// are part of what a demo needs to show.
await db.insert(patient).values({
  userId: LIM.id,
  birthDate: "2001-07-19",
  gender: "female",
  address: "Unit 12B, Ortigas Residences, Pasig City",
  occupation: "Graphic designer",
  emergencyContactName: "Cecilia Lim (mother)",
  emergencyContactPhone: "+63 916 555 0330",
  primaryPhysicianId: cruzDoctorId,
  insuranceProvider: null,
  insurancePolicyNumber: null,
  allergies: null,
  currentMedications: null,
  familyMedicalHistory: null,
  pastMedicalHistory: null,
  identificationType: "Passport",
  identificationNumber: "P9944712A",
  bloodType: "B+",
  consentTreatment: true,
  consentDisclosure: true,
  consentPrivacy: true,
});

console.log("Seeding demo appointments…");

await db.insert(appointment).values([
  {
    patientId: santos.id,
    doctorId: cruzDoctorId,
    reason: "Quarterly diabetes review — fasting sugars have been creeping up in the mornings.",
    preferredSchedule: daysFromNow(3, 10, 0),
    scheduledAt: daysFromNow(3, 10, 30),
    status: "scheduled",
    notes: "Bring the home glucose log. Fasting labs already requested.",
    createdAt: daysAgo(6, 14, 12),
    updatedAt: daysAgo(5, 9, 30),
  },
  {
    patientId: santos.id,
    doctorId: cruzDoctorId,
    reason: "Follow-up on blood pressure and medication tolerance.",
    preferredSchedule: daysAgo(14, 9, 0),
    scheduledAt: daysAgo(14, 9, 0),
    status: "scheduled",
    notes: "Seen — see the consultation note filed the same day.",
    createdAt: daysAgo(21, 11, 5),
    updatedAt: daysAgo(20, 8, 45),
  },
  {
    patientId: santos.id,
    doctorId: uyDoctorId,
    reason: "Palpitations after climbing stairs, twice in the past fortnight.",
    preferredSchedule: daysFromNow(9, 14, 0),
    status: "pending",
    createdAt: daysAgo(1, 20, 41),
    updatedAt: daysAgo(1, 20, 41),
  },
  {
    patientId: delaCruz.id,
    doctorId: uyDoctorId,
    reason: "Chest tightness when climbing stairs at work.",
    preferredSchedule: daysFromNow(5, 11, 0),
    status: "pending",
    createdAt: daysAgo(2, 7, 18),
    updatedAt: daysAgo(2, 7, 18),
  },
  {
    patientId: delaCruz.id,
    doctorId: cruzDoctorId,
    reason: "Annual physical examination.",
    preferredSchedule: daysAgo(9, 15, 0),
    status: "cancelled",
    cancellationReason: "Patient could not get the day off work; asked to rebook after payday.",
    createdAt: daysAgo(16, 9, 2),
    updatedAt: daysAgo(10, 17, 26),
  },
]);

console.log("Seeding demo encounters and vitals…");

const santosInitial = first(
  await db
    .insert(encounter)
    .values({
      patientId: santos.id,
      recordedByUserId: DR_CRUZ.id,
      recordedByName: DR_CRUZ.name,
      recordedByRole: "doctor",
      encounterType: "consultation",
      chiefComplaint: "Increased thirst and night-time urination for about three weeks.",
      subjective:
        "Reports drinking noticeably more water than usual and waking twice nightly to pass urine. Denies weight loss, blurred vision, or foot numbness. Adherent to metformin but admits to skipping the evening dose two or three times a week.",
      objectiveFindings:
        "Alert, well-nourished, in no distress. BP 148/92 seated, repeated 144/90. Chest clear. Heart sounds normal, no murmur. Abdomen soft, non-tender. Peripheral pulses intact, no pedal oedema. Monofilament sensation intact bilaterally.",
      assessment:
        "Type 2 diabetes mellitus with suboptimal glycaemic control, likely adherence-related. Hypertension above target.",
      diagnosis: "Type 2 diabetes mellitus, uncontrolled; essential hypertension",
      plan: "Baseline CBC and fasting blood sugar requested today. Continue metformin 500 mg BID with an emphasis on the evening dose; add losartan 50 mg daily for blood pressure. Review in three months with a home glucose log.",
      recommendations:
        "Reduce sweetened drinks; take a 30-minute walk on at least five days a week. Home BP readings twice weekly.",
      followUpInstructions:
        "Return in three months, sooner if fasting sugars stay above 180 mg/dL.",
      occurredAt: daysAgo(90, 10, 15),
      createdAt: daysAgo(90, 10, 52),
    })
    .returning({ id: encounter.id }),
  "santosInitial",
);

const santosNursing = first(
  await db
    .insert(encounter)
    .values({
      patientId: santos.id,
      recordedByUserId: NURSE.id,
      recordedByName: NURSE.name,
      recordedByRole: "nurse",
      encounterType: "vitals_only",
      chiefComplaint: "Walk-in blood pressure check.",
      subjective:
        "Dropped by after work for a blood pressure check as advised. Feeling well, no headaches or dizziness.",
      objectiveFindings:
        "Vitals recorded. Patient counselled on taking readings at the same time of day.",
      additionalNotes:
        "No physician review needed at the time; readings passed to Dr. Cruz for the next visit.",
      occurredAt: daysAgo(45, 16, 40),
      createdAt: daysAgo(45, 16, 47),
    })
    .returning({ id: encounter.id }),
  "santosNursing",
);

const santosFollowUp = first(
  await db
    .insert(encounter)
    .values({
      patientId: santos.id,
      recordedByUserId: DR_CRUZ.id,
      recordedByName: DR_CRUZ.name,
      recordedByRole: "doctor",
      encounterType: "follow_up",
      chiefComplaint: "Three-month diabetes and hypertension follow-up.",
      subjective:
        "Home log shows fasting sugars mostly 120–150 mg/dL, with a handful of morning readings near 170. Taking both medications consistently now. Walking most evenings. No hypoglycaemic episodes.",
      objectiveFindings:
        "BP 132/84 seated. Weight down 2.4 kg since the last visit. Chest clear, heart sounds normal. Feet examined — skin intact, no ulcers, sensation preserved.",
      assessment:
        "Improved but not yet at target glycaemic control. Blood pressure responding well to losartan.",
      diagnosis: "Type 2 diabetes mellitus, improving control; essential hypertension, controlled",
      plan: "Repeat fasting blood sugar and lipid profile requested today. Continue current doses. Reassess at the quarterly review; consider adding a second agent if fasting sugars remain above target.",
      recommendations:
        "Keep up the evening walks and the home log. Annual eye screening is now due — referral letter given.",
      followUpInstructions:
        "Quarterly review already booked. Call sooner if readings exceed 200 mg/dL on two consecutive mornings.",
      occurredAt: daysAgo(14, 9, 20),
      createdAt: daysAgo(14, 9, 58),
    })
    .returning({ id: encounter.id }),
  "santosFollowUp",
);

const delaCruzVisit = first(
  await db
    .insert(encounter)
    .values({
      patientId: delaCruz.id,
      recordedByUserId: DR_UY.id,
      recordedByName: DR_UY.name,
      recordedByRole: "doctor",
      encounterType: "consultation",
      chiefComplaint: "Chest tightness on exertion for the past month.",
      subjective:
        "Describes a band-like tightness across the chest after climbing two flights of stairs, settling within five minutes of rest. No pain at rest, no radiation to the arm or jaw, no syncope. Former smoker, quit five years ago.",
      objectiveFindings:
        "BP 156/96. Heart rate 88, regular. No murmurs, no carotid bruits. Chest clear. No peripheral oedema. BMI 29.4.",
      assessment:
        "Exertional chest tightness with a reproducible threshold, on a background of hypertension, dyslipidaemia, and a smoking history. Stable angina cannot be excluded on history alone.",
      diagnosis: "Exertional chest pain for investigation; essential hypertension",
      plan: "Blood chemistry panel and a chest X-ray requested today; ECG and stress testing to follow at the cardiology visit. Amlodipine increased to 10 mg daily. Atorvastatin continued.",
      recommendations:
        "Stop any exertion that brings on the tightness and seek emergency care for chest pain lasting more than 15 minutes or occurring at rest.",
      followUpInstructions:
        "Cardiology follow-up once results are in — appointment request already submitted.",
      occurredAt: daysAgo(7, 11, 5),
      createdAt: daysAgo(7, 11, 44),
    })
    .returning({ id: encounter.id }),
  "delaCruzVisit",
);

await db.insert(vitalSign).values([
  {
    encounterId: santosInitial.id,
    patientId: santos.id,
    recordedByUserId: DR_CRUZ.id,
    recordedByName: DR_CRUZ.name,
    bpSystolic: 148,
    bpDiastolic: 92,
    heartRate: 84,
    respiratoryRate: 18,
    temperatureCelsius: 36.7,
    oxygenSaturation: 98,
    weightKg: 71.2,
    heightCm: 158,
    bmi: 28.5,
    notes: "Second reading after five minutes' rest: 144/90.",
    recordedAt: daysAgo(90, 10, 20),
  },
  {
    encounterId: santosNursing.id,
    patientId: santos.id,
    recordedByUserId: NURSE.id,
    recordedByName: NURSE.name,
    bpSystolic: 138,
    bpDiastolic: 88,
    heartRate: 80,
    respiratoryRate: 17,
    temperatureCelsius: 36.5,
    oxygenSaturation: 98,
    weightKg: 70.1,
    heightCm: 158,
    bmi: 28.1,
    notes: "Taken after a ten-minute wait; patient had walked from the jeepney stop.",
    recordedAt: daysAgo(45, 16, 45),
  },
  {
    encounterId: santosFollowUp.id,
    patientId: santos.id,
    recordedByUserId: NURSE.id,
    recordedByName: NURSE.name,
    bpSystolic: 132,
    bpDiastolic: 84,
    heartRate: 76,
    respiratoryRate: 16,
    temperatureCelsius: 36.6,
    oxygenSaturation: 99,
    weightKg: 68.8,
    heightCm: 158,
    bmi: 27.6,
    notes: null,
    recordedAt: daysAgo(14, 9, 12),
  },
  {
    encounterId: delaCruzVisit.id,
    patientId: delaCruz.id,
    recordedByUserId: NURSE.id,
    recordedByName: NURSE.name,
    bpSystolic: 156,
    bpDiastolic: 96,
    heartRate: 88,
    respiratoryRate: 18,
    temperatureCelsius: 36.8,
    oxygenSaturation: 97,
    weightKg: 86.5,
    heightCm: 171.5,
    bmi: 29.4,
    notes: "Patient arrived hurried; reading repeated after rest with the same result.",
    recordedAt: daysAgo(7, 10, 58),
  },
]);

console.log("Seeding demo laboratory results…");

const cbcId = await ensureCatalogItem("hematology", "CBC (Complete Blood Count)");
const fbsId = await ensureCatalogItem("blood_chemistry", "FBS (Fasting Blood Sugar)");
const lipidId = await ensureCatalogItem("blood_chemistry", "Lipid Profile");
const chemistryId = await ensureCatalogItem("blood_chemistry", "Blood Chemistry Panel");
const ecgId = await ensureCatalogItem("imaging", "ECG");
const xrayId = await ensureCatalogItem("imaging", "Chest X-Ray");

// Reviewed: the full lifecycle, request through a doctor's signed read.
const santosCbc = first(
  await db
    .insert(labResult)
    .values({
      patientId: santos.id,
      encounterId: santosInitial.id,
      catalogItemId: cbcId,
      testName: "CBC (Complete Blood Count)",
      category: "hematology",
      status: "reviewed",
      requestedByUserId: DR_CRUZ.id,
      requestedByName: DR_CRUZ.name,
      requestedByRole: "doctor",
      requestNotes: "Baseline count before starting combination therapy.",
      requestedAt: daysAgo(90, 10, 55),
      datePerformed: daysAgo(88, 8, 10),
      dateReleased: daysAgo(87, 13, 0),
      facility: "Medicore Partner Laboratory — Makati",
      summary: "Mild normocytic anaemia; white cell and platelet lines unremarkable.",
      interpretation: "Haemoglobin marginally below the reference range. No evidence of infection.",
      remarks: "Specimen collected fasting.",
      uploadedByUserId: NURSE.id,
      uploadedByName: NURSE.name,
      uploadedByRole: "nurse",
      uploadedAt: daysAgo(87, 14, 20),
      reviewedByUserId: DR_CRUZ.id,
      reviewedByName: DR_CRUZ.name,
      reviewedAt: daysAgo(86, 9, 5),
      reviewInterpretation:
        "Mild anaemia consistent with dietary iron deficiency rather than blood loss; no red flags on history.",
      reviewNotes: "Discussed with the patient by phone.",
      followUpRecommendation: "Repeat haemoglobin at the next quarterly review.",
      actionTaken: "Dietary advice given; no treatment started.",
      createdAt: daysAgo(90, 10, 55),
      updatedAt: daysAgo(86, 9, 5),
    })
    .returning({ id: labResult.id }),
  "santosCbc",
);

await db.insert(labResultParameter).values([
  {
    labResultId: santosCbc.id,
    parameterName: "Haemoglobin",
    value: "11.4",
    unit: "g/dL",
    referenceRange: "12.0 – 15.5",
    flag: "abnormal",
    sortOrder: 0,
  },
  {
    labResultId: santosCbc.id,
    parameterName: "Haematocrit",
    value: "35.1",
    unit: "%",
    referenceRange: "36 – 46",
    flag: "abnormal",
    sortOrder: 1,
  },
  {
    labResultId: santosCbc.id,
    parameterName: "White blood cells",
    value: "6.8",
    unit: "10⁹/L",
    referenceRange: "4.5 – 11.0",
    flag: "normal",
    sortOrder: 2,
  },
  {
    labResultId: santosCbc.id,
    parameterName: "Platelets",
    value: "268",
    unit: "10⁹/L",
    referenceRange: "150 – 400",
    flag: "normal",
    sortOrder: 3,
  },
  {
    labResultId: santosCbc.id,
    parameterName: "MCV",
    value: "84",
    unit: "fL",
    referenceRange: "80 – 100",
    flag: "normal",
    sortOrder: 4,
  },
]);

// Result available: uploaded by the nurse, waiting on a doctor's review —
// this is what lights up the staff dashboard's review queue.
const santosFbs = first(
  await db
    .insert(labResult)
    .values({
      patientId: santos.id,
      encounterId: santosFollowUp.id,
      catalogItemId: fbsId,
      testName: "FBS (Fasting Blood Sugar)",
      category: "blood_chemistry",
      status: "result_available",
      requestedByUserId: DR_CRUZ.id,
      requestedByName: DR_CRUZ.name,
      requestedByRole: "doctor",
      requestNotes: "Fasting, morning collection preferred.",
      requestedAt: daysAgo(14, 10, 2),
      datePerformed: daysAgo(9, 7, 45),
      dateReleased: daysAgo(8, 12, 15),
      facility: "Medicore Partner Laboratory — Makati",
      findings: "Fasting plasma glucose 142 mg/dL.",
      summary: "Above target for a treated diabetic patient, improved from the previous 186 mg/dL.",
      uploadedByUserId: NURSE.id,
      uploadedByName: NURSE.name,
      uploadedByRole: "nurse",
      uploadedAt: daysAgo(8, 13, 5),
      createdAt: daysAgo(14, 10, 2),
      updatedAt: daysAgo(8, 13, 5),
    })
    .returning({ id: labResult.id }),
  "santosFbs",
);

await db.insert(labResultParameter).values([
  {
    labResultId: santosFbs.id,
    parameterName: "Fasting plasma glucose",
    value: "142",
    unit: "mg/dL",
    referenceRange: "70 – 100",
    flag: "abnormal",
    remarks: "Previous result 186 mg/dL (3 months ago).",
    sortOrder: 0,
  },
]);

// Pending: requested, collected, no result back yet.
await db.insert(labResult).values({
  patientId: santos.id,
  encounterId: santosFollowUp.id,
  catalogItemId: lipidId,
  testName: "Lipid Profile",
  category: "blood_chemistry",
  status: "pending",
  requestedByUserId: DR_CRUZ.id,
  requestedByName: DR_CRUZ.name,
  requestedByRole: "doctor",
  requestNotes: "Twelve-hour fast. Bundle with the fasting glucose draw.",
  requestedAt: daysAgo(14, 10, 3),
  datePerformed: daysAgo(9, 7, 45),
  facility: "Medicore Partner Laboratory — Makati",
  createdAt: daysAgo(14, 10, 3),
  updatedAt: daysAgo(9, 8, 0),
});

// Requested: brand new, nothing done yet.
await db.insert(labResult).values({
  patientId: santos.id,
  catalogItemId: ecgId,
  testName: "ECG",
  category: "imaging",
  status: "requested",
  requestedByUserId: DR_UY.id,
  requestedByName: DR_UY.name,
  requestedByRole: "doctor",
  requestNotes: "Baseline tracing ahead of the cardiology consultation for palpitations.",
  requestedAt: daysAgo(1, 20, 50),
  createdAt: daysAgo(1, 20, 50),
  updatedAt: daysAgo(1, 20, 50),
});

const delaCruzChem = first(
  await db
    .insert(labResult)
    .values({
      patientId: delaCruz.id,
      encounterId: delaCruzVisit.id,
      catalogItemId: chemistryId,
      testName: "Blood Chemistry Panel",
      category: "blood_chemistry",
      status: "result_available",
      requestedByUserId: DR_UY.id,
      requestedByName: DR_UY.name,
      requestedByRole: "doctor",
      requestNotes: "Include lipids, renal function, and electrolytes.",
      requestedAt: daysAgo(7, 11, 50),
      datePerformed: daysAgo(4, 7, 30),
      dateReleased: daysAgo(3, 10, 40),
      facility: "Medicore Partner Laboratory — Pasig",
      findings: "Markedly raised LDL cholesterol with borderline renal function.",
      summary: "Dyslipidaemia not at target on current statin dose. Creatinine at the upper limit.",
      uploadedByUserId: NURSE.id,
      uploadedByName: NURSE.name,
      uploadedByRole: "nurse",
      uploadedAt: daysAgo(3, 11, 25),
      createdAt: daysAgo(7, 11, 50),
      updatedAt: daysAgo(3, 11, 25),
    })
    .returning({ id: labResult.id }),
  "delaCruzChem",
);

await db.insert(labResultParameter).values([
  {
    labResultId: delaCruzChem.id,
    parameterName: "Total cholesterol",
    value: "268",
    unit: "mg/dL",
    referenceRange: "< 200",
    flag: "abnormal",
    sortOrder: 0,
  },
  {
    labResultId: delaCruzChem.id,
    parameterName: "LDL cholesterol",
    value: "191",
    unit: "mg/dL",
    referenceRange: "< 100",
    flag: "critical",
    remarks: "Very high for a patient with exertional symptoms.",
    sortOrder: 1,
  },
  {
    labResultId: delaCruzChem.id,
    parameterName: "HDL cholesterol",
    value: "38",
    unit: "mg/dL",
    referenceRange: "> 40",
    flag: "abnormal",
    sortOrder: 2,
  },
  {
    labResultId: delaCruzChem.id,
    parameterName: "Triglycerides",
    value: "212",
    unit: "mg/dL",
    referenceRange: "< 150",
    flag: "abnormal",
    sortOrder: 3,
  },
  {
    labResultId: delaCruzChem.id,
    parameterName: "Creatinine",
    value: "1.3",
    unit: "mg/dL",
    referenceRange: "0.7 – 1.3",
    flag: "normal",
    sortOrder: 4,
  },
  {
    labResultId: delaCruzChem.id,
    parameterName: "Potassium",
    value: "4.1",
    unit: "mmol/L",
    referenceRange: "3.5 – 5.1",
    flag: "normal",
    sortOrder: 5,
  },
]);

await db.insert(labResult).values({
  patientId: delaCruz.id,
  encounterId: delaCruzVisit.id,
  catalogItemId: xrayId,
  testName: "Chest X-Ray",
  category: "imaging",
  status: "pending",
  requestedByUserId: DR_UY.id,
  requestedByName: DR_UY.name,
  requestedByRole: "doctor",
  requestNotes: "PA and lateral views.",
  requestedAt: daysAgo(7, 11, 52),
  facility: "Medicore Partner Laboratory — Pasig",
  createdAt: daysAgo(7, 11, 52),
  updatedAt: daysAgo(7, 11, 52),
});

await db.insert(labResult).values({
  patientId: delaCruz.id,
  catalogItemId: cbcId,
  testName: "CBC (Complete Blood Count)",
  category: "hematology",
  status: "cancelled",
  requestedByUserId: NURSE.id,
  requestedByName: NURSE.name,
  requestedByRole: "nurse",
  requestNotes: "Requested during triage.",
  requestedAt: daysAgo(7, 10, 55),
  cancellationReason:
    "Duplicate — already covered by the blood chemistry panel ordered the same day.",
  createdAt: daysAgo(7, 10, 55),
  updatedAt: daysAgo(7, 12, 10),
});

// One outstanding invite so the admin's staff screen isn't empty either.
await db.insert(staffInvite).values({
  email: "dr.mendez@medicore.test",
  role: "doctor",
  invitedByUserId: ADMIN.id,
  createdAt: daysAgo(2, 15, 30),
});

console.log("\nDemo data seeded. Sign in with any of these (code %s):\n", DEMO_OTP);
for (const entry of DEMO_ACCOUNTS) {
  console.log(`  ${entry.role.padEnd(7)} ${entry.email.padEnd(32)} ${entry.name}`);
}
console.log("\nSet DEMO_MODE=true in .env and restart the API for the fixed code to apply.");

process.exit(0);
