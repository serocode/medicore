import type { UserAccountRole } from "@/shared/lib/types";

/**
 * The in-app user guide.
 *
 * Every statement here describes behaviour that exists in this repository
 * today. When a workflow changes, this file changes with it — a guide that
 * documents intentions rather than the running system is worse than none,
 * because people trust it.
 */

export interface HelpStep {
  title: string;
  body: string;
}

export interface HelpTerm {
  term: string;
  definition: string;
}

export interface HelpSection {
  id: string;
  title: string;
  /** Short framing sentence for the section. */
  intro?: string;
  steps?: HelpStep[];
  /** Plain bullets, for capability lists rather than ordered procedures. */
  points?: string[];
}

export interface RoleGuide {
  role: UserAccountRole;
  label: string;
  /** One line answering "what is this role for?" */
  summary: string;
  /** Where this role lands after signing in. */
  landing: string;
  sections: HelpSection[];
  /** Things this role genuinely cannot do — stated plainly, not apologetically. */
  limits: string[];
  glossary?: HelpTerm[];
}

const SIGNING_IN: HelpSection = {
  id: "signing-in",
  title: "Signing in",
  intro: "Medicore has no passwords. You sign in with a one-time code sent to your email address.",
  steps: [
    {
      title: "Enter your email address",
      body: "On the sign-in page, type the address your account uses and choose Send code.",
    },
    {
      title: "Enter the six-digit code",
      body: "The code is valid for five minutes. If you leave the page to go and find it, the verification step is still waiting when you come back.",
    },
    {
      title: "If the code stops working",
      body: "Choose Send a new code on the verification step. There is a short wait between requests. Only the most recent code works — an older one is rejected even if it hasn't expired.",
    },
  ],
};

const PATIENT_GUIDE: RoleGuide = {
  role: "patient",
  label: "Patients",
  summary:
    "Book appointments with a physician and keep the details your care team holds about you up to date.",
  landing: "Signing in takes you to My appointments.",
  sections: [
    SIGNING_IN,
    {
      id: "patient-registration",
      title: "Registering",
      intro:
        "Before you can book, Medicore needs a profile. You are sent to the registration form automatically the first time you sign in.",
      steps: [
        {
          title: "Fill in your details",
          body: "Personal information, an emergency contact, your medical information, and identification. Fields marked with a red asterisk are required; the rest can be left blank and added later.",
        },
        {
          title: "Upload your identification",
          body: "A JPEG, PNG, or PDF up to 5 MB. You can click the box or drag a file onto it. Anything larger, or of another type, is refused straight away with the reason.",
        },
        {
          title: "Give consent",
          body: "All three consent checkboxes — treatment, disclosure of health information to your care team, and having read the privacy, cookie, and terms documents — must be ticked before the form will submit. Each links to the document it refers to; the links open in a new tab so you don't lose what you have typed.",
        },
        {
          title: "Choose Complete registration",
          body: "You are taken to the booking form. Your details can be changed at any time from Account.",
        },
      ],
    },
    {
      id: "patient-booking",
      title: "Booking an appointment",
      intro: "Booking creates a request, not a confirmed slot. The clinic decides the final time.",
      steps: [
        {
          title: "Choose a physician, a date, and a time",
          body: "Pick from the physicians the clinic lists, then a weekday and one of the half-hour slots offered. The clinic is open Monday to Friday, 8:00 AM to 12:00 PM and 1:00 PM to 5:00 PM Philippine time — weekends, the lunch break, and times that have already passed aren't offered.",
        },
        {
          title: "Say what the visit is about",
          body: "The reason is required. The notes box is optional — use it for anything the clinic should know in advance.",
        },
        {
          title: "Send the request",
          body: "Your appointment appears under Upcoming as Awaiting confirmation.",
        },
        {
          title: "Wait to hear back",
          body: "When the clinic confirms or cancels your request, Medicore emails you. A confirmed appointment shows as Scheduled with the time the clinic set.",
        },
      ],
    },
    {
      id: "patient-managing",
      title: "Changing or cancelling an appointment",
      intro: "You can cancel any appointment of your own that has not already been cancelled.",
      steps: [
        {
          title: "Choose Cancel on the appointment",
          body: "You are asked for a reason, which the clinic sees. Cancelling cannot be undone.",
        },
        {
          title: "To move an appointment",
          body: "There is no reschedule button. Cancel the existing appointment and book a new one at the time you want.",
        },
      ],
    },
    {
      id: "patient-account",
      title: "Your account",
      points: [
        "Account holds everything you entered at registration, and you can change any of it.",
        "Your email address is fixed — it is the address you sign in with.",
        "If you start editing and try to navigate away, Medicore asks before discarding your changes.",
        "Delete my account removes your profile from active use and cancels any pending or scheduled appointments. Your appointment history is kept for the clinic's records.",
      ],
    },
  ],
  limits: [
    "You see only your own appointments — never another patient's.",
    "You cannot set the time of your appointment; the clinic confirms it.",
    "You cannot reschedule in place. Cancel and book again instead.",
    "Clinical records, vital signs, and laboratory results are recorded and read by clinic staff. They are not shown to you in Medicore.",
    "There is no messaging in Medicore. The clinic contacts you by email about appointment changes.",
  ],
  glossary: [
    {
      term: "Philippine time (GMT+8)",
      definition:
        "Every date and time in Medicore is the clinic's local time, wherever you are reading it. A slot shown as 10:00 AM is 10:00 AM in Manila.",
    },
    {
      term: "Awaiting confirmation",
      definition: "You have requested this appointment and the clinic has not yet set a time.",
    },
    {
      term: "Scheduled",
      definition: "The clinic has confirmed a time. The time shown is the confirmed one.",
    },
    {
      term: "Cancelled",
      definition: "The appointment will not happen. The reason is shown, whoever cancelled it.",
    },
  ],
};

const CLINICAL_SHARED: HelpSection[] = [
  {
    id: "staff-dashboard",
    title: "Your dashboard",
    intro: "Everything waiting on you, in one place.",
    points: [
      "Upcoming appointments — confirmed visits, soonest first, with a count of how many are today.",
      "Laboratory requests — tests that have been ordered but have no result attached yet.",
      "Patients — every registered patient. Once there are more than five, a search box appears.",
      "Each patient row links to their full record, or straight to a new encounter.",
    ],
  },
  {
    id: "staff-record",
    title: "Reading a patient record",
    intro:
      "The record header shows age, gender, blood type, contact details, and — highlighted in red — any recorded allergies.",
    points: [
      "Overview — current medications, medical history, the most recent vitals and encounter, and recent laboratory results.",
      "Vitals — every reading ever recorded, newest first.",
      "Timeline — every encounter written up, newest first, with all the notes taken.",
      "Labs — every test ordered, filterable by status and sortable by date.",
      "The number beside each tab is how many entries it holds. Tabs respond to the left and right arrow keys.",
    ],
  },
  {
    id: "staff-encounter",
    title: "Recording an encounter",
    intro: "An encounter is the written record of a visit. It cannot be edited once saved.",
    steps: [
      {
        title: "Choose the encounter type",
        body: "Consultation, follow-up, nursing check, vitals only, or other.",
      },
      {
        title: "Record vital signs",
        body: "Leave a measurement blank if it was not taken — a blank is not stored as zero. Values outside a clinically possible range are refused, with the acceptable range in the message.",
      },
      {
        title: "Write up the visit",
        body: "The note fields you get depend on your role. Everything here is optional; save only what you actually observed.",
      },
      {
        title: "Save the encounter",
        body: "You land on the patient's Timeline with the new entry at the top. If you try to leave the form with unsaved work, Medicore asks first.",
      },
    ],
  },
  {
    id: "staff-labs",
    title: "The laboratory workflow",
    intro:
      "A test moves through fixed stages. Each stage is a status you can see on the result and filter by.",
    steps: [
      {
        title: "Request a test",
        body: "From a patient record, choose Request lab test, pick from the catalogue, and add the clinical indication. The test is now Requested.",
      },
      {
        title: "Hand it to the laboratory",
        body: "Choose Mark as sent to laboratory once the request has left the clinic. The test shows as At laboratory.",
      },
      {
        title: "Upload the result",
        body: "Attach the laboratory's report and transcribe its values. One row per measured parameter — press Enter in any row to start the next. The test becomes Awaiting review.",
      },
      {
        title: "A doctor signs it off",
        body: "Only a doctor can complete this step. Once signed off, the test is Reviewed and nothing further can be changed.",
      },
    ],
  },
];

const DOCTOR_GUIDE: RoleGuide = {
  role: "doctor",
  label: "Doctors",
  summary: "Run consultations, write up encounters, order laboratory work, and sign off results.",
  landing: "Signing in takes you to the clinical dashboard.",
  sections: [
    SIGNING_IN,
    ...CLINICAL_SHARED,
    {
      id: "doctor-review",
      title: "Reviewing a laboratory result",
      intro:
        "Signing off is a doctor-only step, and it is what closes a laboratory request. Awaiting your review on your dashboard lists everything waiting.",
      steps: [
        {
          title: "Open the result",
          body: "Read the report, the transcribed parameter values, and any notes the laboratory supplied. Values flagged abnormal or critical are emphasised.",
        },
        {
          title: "Write your interpretation",
          body: "A clinical interpretation is required — the form will not submit without one. Notes, a follow-up recommendation, and action taken are optional.",
        },
        {
          title: "Sign off the review",
          body: "The result becomes Reviewed and your interpretation is recorded against it permanently.",
        },
      ],
    },
    {
      id: "doctor-notes",
      title: "What you record",
      points: [
        "A SOAP note — subjective, objective, assessment, plan.",
        "A diagnosis. This field is recorded for doctors only.",
        "Recommendations and follow-up instructions.",
        "Vital signs and a chief complaint, the same as nursing staff.",
      ],
    },
    {
      id: "doctor-profile",
      title: "Your profile",
      points: [
        "My profile holds the name and specialisation patients see when they choose a physician.",
        "Keep it current — it is how patients identify you at booking.",
      ],
    },
  ],
  limits: [
    "Upcoming appointments shows only appointments booked with you, not the whole clinic's.",
    "You cannot confirm or cancel appointments. That is an administrator's job.",
    "An encounter cannot be edited or deleted once saved. Record a correction as a new encounter.",
    "A reviewed or cancelled laboratory result is final and cannot be reopened.",
    "You cannot change anyone's role or disable an account.",
  ],
  glossary: [
    { term: "Requested", definition: "The test has been ordered but has not left the clinic." },
    {
      term: "At laboratory",
      definition: "The request has been handed over and a result is awaited.",
    },
    {
      term: "Awaiting review",
      definition: "A result has been uploaded and needs a doctor's interpretation.",
    },
    { term: "Reviewed", definition: "A doctor has signed off. The result is final." },
    {
      term: "Cancelled",
      definition: "The request was withdrawn before a result arrived. It cannot be reopened.",
    },
  ],
};

const NURSE_GUIDE: RoleGuide = {
  role: "nurse",
  label: "Nurses",
  summary: "Record vitals and nursing observations, and move laboratory work through the clinic.",
  landing: "Signing in takes you to the nursing dashboard.",
  sections: [
    SIGNING_IN,
    ...CLINICAL_SHARED,
    {
      id: "nurse-notes",
      title: "What you record",
      points: [
        "Vital signs — blood pressure, heart and respiratory rate, temperature, oxygen saturation, weight, and height.",
        "An assessment and nursing observations.",
        "The intervention performed and how the patient responded.",
        "The diagnosis and SOAP fields are not part of the nursing form; those are recorded by doctors.",
      ],
    },
    {
      id: "nurse-labs",
      title: "Laboratory work",
      points: [
        "You can order a test, mark it as sent to the laboratory, upload the result, and cancel a request that is no longer needed.",
        "You cannot sign off a result. A result you upload sits at Awaiting review until a doctor interprets it.",
      ],
    },
  ],
  limits: [
    "Upcoming appointments shows the whole clinic's schedule, with the attending physician on each row. Appointments are assigned to physicians, not to nursing staff.",
    "You cannot confirm or cancel appointments. That is an administrator's job.",
    "You cannot sign off a laboratory result — that step is doctor-only.",
    "An encounter cannot be edited or deleted once saved.",
    "You cannot change anyone's role or disable an account.",
  ],
  glossary: DOCTOR_GUIDE.glossary,
};

const ADMIN_GUIDE: RoleGuide = {
  role: "admin",
  label: "Administrators",
  summary: "Decide when appointments happen, and control who can sign in and as what.",
  landing: "Signing in takes you to clinic administration.",
  sections: [
    SIGNING_IN,
    {
      id: "admin-appointments",
      title: "Handling appointment requests",
      intro:
        "The Appointments tab is the clinic's queue. The three tiles count everything awaiting confirmation, scheduled, and cancelled.",
      steps: [
        {
          title: "Find requests awaiting confirmation",
          body: "Every request a patient has sent appears in the table with its status, the time they asked for, and the physician they chose.",
        },
        {
          title: "Schedule it",
          body: "Choose Schedule, then a weekday and one of the clinic's half-hour slots. Medicore refuses a slot outside opening hours, and one that would double-book the same physician at the same moment.",
        },
        {
          title: "Or cancel it",
          body: "Choose Cancel and give a reason. The reason is emailed to the patient, so write it for them to read.",
        },
        {
          title: "Either way, the patient is emailed",
          body: "Confirmation and cancellation both send an email automatically. There is nothing further to send.",
        },
      ],
    },
    {
      id: "admin-staff",
      title: "Managing staff accounts",
      intro: "The Staff tab lists everyone who is not a patient. Changes take effect immediately.",
      steps: [
        {
          title: "Invite a colleague",
          body: "Choose Invite staff, give their email address and the role they should have. Medicore does not send the invitation — tell them to sign in, and the role applies the first time they do.",
        },
        {
          title: "Change someone's role",
          body: "Use the Role dropdown on their row. Promoting someone to doctor or nurse creates their professional profile automatically.",
        },
        {
          title: "Withdraw sign-in access",
          body: "Choose Disable. They are signed out immediately and cannot sign back in. Their records stay exactly where they are, and you can restore access at any time.",
        },
        {
          title: "Revoke an invitation",
          body: "A pending invitation can be revoked from the Pending invites card until the person first signs in.",
        },
      ],
    },
  ],
  limits: [
    "You cannot change your own role or disable your own account. Those controls are greyed out on your row, so an administrator cannot lock themselves out.",
    "You cannot see patient records, encounters, vital signs, or laboratory results. Administration is deliberately separated from clinical data.",
    "You cannot record clinical information of any kind.",
    "Inviting someone does not email them. Medicore only stores the role to apply when they sign in.",
  ],
  glossary: [
    {
      term: "Awaiting confirmation",
      definition: "A patient has requested this appointment and it needs a time set.",
    },
    {
      term: "Scheduled",
      definition: "You have confirmed a time and the patient has been emailed.",
    },
    { term: "Cancelled", definition: "The appointment will not happen. The reason was emailed." },
    {
      term: "Disabled",
      definition:
        "The account cannot sign in. Nothing is deleted, and access can be restored at any time.",
    },
    {
      term: "Pending invite",
      definition:
        "A role reserved for an email address that has not signed in yet. It applies on their first sign-in.",
    },
  ],
};

export const ROLE_GUIDES: RoleGuide[] = [PATIENT_GUIDE, DOCTOR_GUIDE, NURSE_GUIDE, ADMIN_GUIDE];

export function guideForRole(role: string | undefined): RoleGuide {
  return ROLE_GUIDES.find((guide) => guide.role === role) ?? PATIENT_GUIDE;
}
