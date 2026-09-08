/**
 * The privacy policy, terms of use, and cookie policy.
 *
 * Written against what this repository actually does — the data the schema
 * stores, the roles the API grants, the cookie Better Auth sets, the email
 * provider that sends the codes. A policy that describes an imagined product
 * is worse than none: people rely on these pages to know who can read their
 * medical record.
 *
 * If you change what the product collects, who can see it, or how long it is
 * kept, change these documents in the same commit.
 *
 * NOTE FOR MAINTAINERS: this is a drafted starting point, not legal advice.
 * Have it reviewed by qualified counsel — and reconcile it with the health
 * privacy law that applies to your clinic — before running it with real
 * patients.
 */

export interface LegalTable {
  /** Names the table for screen readers, and reads as its heading. */
  caption: string;
  columns: string[];
  rows: string[][];
}

export interface LegalSection {
  id: string;
  title: string;
  /** Paragraphs, in order. */
  body?: string[];
  points?: string[];
  table?: LegalTable;
}

export type LegalSlug = "privacy" | "terms" | "cookies";

export interface LegalDocument {
  slug: LegalSlug;
  path: string;
  title: string;
  /** One sentence, shown under the title and used as the page description. */
  summary: string;
  /** ISO date. Rendered in the clinic's timezone by the page. */
  updated: string;
  sections: LegalSection[];
}

const UPDATED = "2026-09-08";

/** Reused wherever a document tells the reader where to write to. */
const CONTACT_EMAIL = "privacy@medicore.example";

export const PRIVACY_POLICY: LegalDocument = {
  slug: "privacy",
  path: "/privacy",
  title: "Privacy policy",
  summary:
    "What Medicore records about you, who inside the clinic can read it, and how long it is kept.",
  updated: UPDATED,
  sections: [
    {
      id: "scope",
      title: "Who this covers",
      body: [
        "Medicore is the clinic's patient record and appointment system. This policy covers the information the clinic holds about you in Medicore — as a patient, or as a member of clinic staff with an account.",
        `The clinic is the controller of that information: it decides what is recorded and who may read it. Questions, corrections, and complaints go to ${CONTACT_EMAIL}, or to the clinic reception.`,
      ],
    },
    {
      id: "what-we-hold",
      title: "What we hold",
      body: [
        "Everything below is entered either by you, when you register or book, or by a clinician recording what happened during your care.",
      ],
      table: {
        caption: "Information held about a patient",
        columns: ["Category", "What it includes"],
        rows: [
          [
            "Account",
            "Your name, email address, and an optional profile photo you upload yourself.",
          ],
          [
            "Identity",
            "Date of birth, gender, home address, occupation, the type and number of an identity document, and the copy of that document you upload during registration.",
          ],
          ["Contact for emergencies", "The name and phone number of the person you nominate."],
          ["Insurance", "Your insurance provider and policy number, if you give them."],
          [
            "Health background",
            "Allergies, current medications, past medical history, family medical history, and blood type — as you report them at registration.",
          ],
          [
            "Appointments",
            "The physician you asked for, your stated reason for the visit, the time you preferred, the time the clinic scheduled, and any cancellation and its reason.",
          ],
          [
            "Clinical records",
            "Each consultation written up by the doctor or nurse who saw you: chief complaint, findings, assessment, diagnosis, plan, and follow-up instructions, with their name and the date attached.",
          ],
          [
            "Vital signs",
            "Blood pressure, heart and respiratory rate, temperature, oxygen saturation, weight, height, and BMI, recorded visit by visit.",
          ],
          [
            "Laboratory",
            "Tests requested for you, their status, the result values and reference ranges, any report file the clinic uploads, and the doctor's written interpretation.",
          ],
          [
            "Technical",
            "A session cookie that keeps you signed in, the one-time codes sent to your email while they are valid, and the timestamps stored alongside each record.",
          ],
        ],
      },
    },
    {
      id: "why",
      title: "Why we hold it",
      points: [
        "To provide your care and keep an accurate clinical record of it.",
        "To schedule appointments, and to email you when one is confirmed or cancelled.",
        "To confirm you are who you say you are before showing anyone a medical record.",
        "To send the one-time codes that sign you in.",
        "To keep the service secure and working — for example, checking on every request that the account asking for a record is allowed to see it.",
      ],
      body: [
        "You are asked for three specific consents when you register: to treatment, to your health information being disclosed to your care team, and to this policy. Registration cannot be completed without all three, and the answers are stored with your record. You can see them at any time on your Account page.",
      ],
    },
    {
      id: "who-sees-it",
      title: "Who can see it",
      body: [
        "Medicore is a single clinic's system. Nothing in it is shared with anyone outside the clinic except the service providers named below.",
      ],
      points: [
        "You can see your own account details, the consents on file, and your appointments when you sign in.",
        "Doctors and nurses with an account at this clinic can open any patient's record — the clinical notes, vitals, and laboratory results — because any of them may be the clinician who sees you. Every entry records who wrote it and when.",
        "Administrators manage accounts and roles, and see appointment counts. They do not have a route into consultation notes or laboratory results.",
        "Clinical notes and laboratory results are not shown to patients inside Medicore today. Ask the clinic for a copy of your record and it will be provided to you.",
      ],
    },
    {
      id: "processors",
      title: "Service providers",
      points: [
        "Email delivery — Resend, which handles the messages containing your sign-in codes and appointment confirmations. It processes your email address and the content of those messages, on the clinic's instructions.",
        "Hosting and database — the servers the clinic runs Medicore on. Uploaded identity documents and laboratory reports are stored as files there, not with any third party.",
      ],
      body: [
        "No advertising network, analytics provider, or data broker receives anything from Medicore. There is no tracking in this product to share.",
      ],
    },
    {
      id: "retention",
      title: "How long it is kept",
      body: [
        "Your clinical record — consultations, vitals, and laboratory results — is kept for as long as health-records law requires the clinic to keep it. Clinical entries are never edited or deleted after they are signed: a correction is recorded as a new entry, so the history of your care stays intact.",
        "Closing your account cancels any appointment that has not happened yet and removes your profile from the clinic's active patient list. It does not erase the medical record of care you have already received, which the clinic is required to retain.",
        "Sign-in codes expire five minutes after they are sent. A session ends seven days after you sign in, or immediately when you sign out.",
      ],
    },
    {
      id: "your-choices",
      title: "Your choices",
      points: [
        "See and correct your details — the Account page holds your profile, your consents, and the identity document you uploaded.",
        "Ask for a copy of your full record, including clinical notes and results, from the clinic.",
        "Close your account from the Account page. The clinic will tell you what it must keep and why.",
        "Withdraw a consent, or object to how your information is used, by writing to the clinic. Withdrawing consent to treatment or to disclosure to your care team will limit the care the clinic can safely provide, and it will say so plainly rather than quietly carrying on.",
        "Complain to the clinic, and to your national data protection authority if the clinic's answer does not satisfy you.",
      ],
    },
    {
      id: "security",
      title: "How it is protected",
      points: [
        "There are no passwords to leak: signing in requires a code emailed to your address, valid for five minutes and usable once.",
        "Every request to the API is checked against the signed-in account's role, and a disabled account is refused even if its session cookie is still valid.",
        "Uploaded identity documents and laboratory reports are served only to the person they belong to and to clinical staff — never from a public link.",
        "The session cookie cannot be read by JavaScript, and is sent over HTTPS only when the clinic runs Medicore over HTTPS.",
        "No system is perfectly secure. If a breach affects your information, the clinic will tell you and the relevant authority as the law requires.",
      ],
    },
    {
      id: "children",
      title: "Children and people you act for",
      body: [
        "An account belongs to the person named on it. A parent, guardian, or authorised representative may register and manage an account on behalf of someone who cannot do so themselves, and is responsible for the accuracy of what they enter.",
      ],
    },
    {
      id: "changes",
      title: "Changes to this policy",
      body: [
        "The date at the top of this page is the date it last changed. If a change affects what is collected or who can read it, the clinic will say so when you next sign in rather than relying on you to notice.",
      ],
    },
  ],
};

export const TERMS_OF_USE: LegalDocument = {
  slug: "terms",
  path: "/terms",
  title: "Terms and conditions",
  summary: "The rules for using Medicore, and what it is — and is not — for.",
  updated: UPDATED,
  sections: [
    {
      id: "emergencies",
      title: "Medicore is not for emergencies",
      body: [
        "Do not use Medicore to report a medical emergency. Nothing you enter here is monitored in real time, and an appointment request is not seen by anyone until clinic staff open it.",
        "If you or someone else is seriously unwell — chest pain, difficulty breathing, heavy bleeding, loss of consciousness, or anything else you believe is urgent — call your local emergency number or go to the nearest emergency department.",
      ],
    },
    {
      id: "acceptance",
      title: "Agreeing to these terms",
      body: [
        "By registering for or signing in to Medicore you agree to these terms. If you do not agree to them, do not use the service; the clinic will arrange your care by other means.",
        "These terms sit alongside the privacy policy, which explains what is recorded about you, and the cookie policy, which explains the one cookie this product sets.",
      ],
    },
    {
      id: "who-can-use",
      title: "Who can use it",
      points: [
        "Patients of this clinic, registering with their own details or on behalf of someone they are authorised to act for.",
        "Doctors, nurses, and administrators, using an account issued to them by a clinic administrator. Staff roles are assigned by the clinic and cannot be self-selected.",
      ],
    },
    {
      id: "your-account",
      title: "Your account",
      points: [
        "Give an email address you control and can receive mail at — it is the only way into your account.",
        "Sign-in codes are single-use and personal. Do not forward one to anyone, including anyone claiming to be from the clinic; staff will never ask you for a code.",
        "Tell the clinic promptly if you lose access to your email address or believe someone else has used your account.",
        "An administrator can disable a staff account. A disabled account cannot sign in, and its existing entries in patient records remain, because they are part of the clinical history.",
      ],
    },
    {
      id: "appointments",
      title: "Appointments",
      points: [
        "Booking submits a request. It is not an appointment until the clinic confirms it and you receive the confirmation email with the scheduled time.",
        "The clinic may cancel or reschedule a request, and will give a reason when it does.",
        "You can cancel your own appointment from your dashboard. Please do it as early as you can so the slot can go to someone else.",
        "The preferred time you choose is a request, not a reservation — the clinic schedules the actual slot.",
      ],
    },
    {
      id: "clinical",
      title: "Clinical information",
      body: [
        "Medicore records care; it does not provide it. Nothing in this product is medical advice, a diagnosis, or a treatment recommendation, and no part of it is a substitute for speaking to a qualified clinician.",
        "Clinical notes, vitals, and laboratory results are written by the clinicians who saw you, and each entry carries their name and the time it was recorded. A laboratory result is not a finding until a doctor has reviewed and interpreted it.",
      ],
    },
    {
      id: "acceptable-use",
      title: "Using it properly",
      points: [
        "Enter information that is accurate and yours to enter. Registering with someone else's identity document is not permitted.",
        "Do not attempt to reach records that are not yours, whatever your role — access is logged against your account.",
        "Do not upload files that are not what they claim to be, or that contain anything harmful.",
        "Do not scrape, load-test, or automate against the service without the clinic's written permission.",
        "Do not use anything you see in a patient record for any purpose other than that patient's care.",
      ],
    },
    {
      id: "your-content",
      title: "What you upload",
      body: [
        "You keep ownership of the identity document and profile photo you upload. You give the clinic permission to store and display them for the purposes described in the privacy policy — verifying who you are and identifying you in the system — and for nothing else.",
        "You are responsible for having the right to upload what you upload.",
      ],
    },
    {
      id: "availability",
      title: "Availability",
      body: [
        "The clinic aims to keep Medicore available but does not promise it will be uninterrupted or error-free. It may be taken down for maintenance, and features may change as the clinic's needs change.",
        "If Medicore is unavailable when you need the clinic, phone the clinic. Your care does not depend on this software being up.",
      ],
    },
    {
      id: "liability",
      title: "Liability",
      body: [
        "To the fullest extent the law allows, the clinic is not liable for indirect or consequential loss arising from your use of Medicore, or for loss caused by information you entered incorrectly.",
        "Nothing in these terms limits liability for death or personal injury caused by negligence, for fraud, or for anything else that cannot lawfully be limited. Your rights as a patient are unaffected by these terms.",
      ],
    },
    {
      id: "ending",
      title: "Ending your use",
      body: [
        "You can close your account at any time from the Account page. Doing so cancels appointments that have not happened yet. The clinic keeps the medical record of care already given, as the privacy policy explains.",
        "The clinic may suspend or close an account that is being used in breach of these terms, and will tell the account holder why.",
      ],
    },
    {
      id: "changes-law",
      title: "Changes and governing law",
      body: [
        "These terms may change; the date at the top of this page is the date they last did. Continuing to use Medicore after a change means accepting the revised terms.",
        "These terms are governed by the laws of the Republic of the Philippines, and the courts of Metro Manila have jurisdiction over any dispute — without affecting any right you have to bring a claim where you live.",
      ],
    },
  ],
};

export const COOKIE_POLICY: LegalDocument = {
  slug: "cookies",
  path: "/cookies",
  title: "Cookie policy",
  summary: "Medicore sets one cookie, and it is the one that keeps you signed in.",
  updated: UPDATED,
  sections: [
    {
      id: "short-version",
      title: "The short version",
      body: [
        "Medicore uses one strictly necessary cookie, to keep you signed in between pages. There is no advertising cookie, no analytics cookie, and no third-party tracker in this product — so there is nothing here to opt into, and no consent banner to click past.",
      ],
    },
    {
      id: "cookies-we-set",
      title: "The cookie we set",
      table: {
        caption: "Cookies set by Medicore",
        columns: ["Name", "What it does", "How long it lasts"],
        rows: [
          [
            "better-auth.session_token",
            "Identifies your signed-in session so the server knows which account is asking for a page. It holds a random token, not your name or medical information.",
            "Seven days, or until you sign out. Renewed as you keep using the service.",
          ],
        ],
      },
      points: [
        "It cannot be read by JavaScript running in the page (HttpOnly), which limits the damage a cross-site scripting bug could do.",
        "It is only sent to Medicore's own server, and not on requests started by other sites (SameSite=Lax).",
        "It is marked Secure — HTTPS only — wherever the clinic runs Medicore over HTTPS.",
      ],
    },
    {
      id: "browser-storage",
      title: "Other browser storage",
      body: [
        "Two things are kept in your browser that are not cookies and are never sent to the server:",
      ],
      points: [
        "medicore.pending-otp — your email address and the time a sign-in code was sent, held in session storage so the verification step is still waiting for you if you reload the page or switch tabs to find the code. It is cleared when you sign in, when the code expires, and when you close the tab.",
        "Nothing else. Medicore stores no preferences, identifiers, or history in your browser.",
      ],
    },
    {
      id: "why-no-banner",
      title: "Why there is no cookie banner",
      body: [
        "Consent is required for cookies that are not strictly necessary — the ones that measure, profile, or advertise. A cookie whose only job is to keep you signed in on a service you asked to sign in to is exempt, and asking you to agree to it would be theatre.",
        "If Medicore ever sets a cookie that does need consent, it will ask for it properly, and this page will say so first.",
      ],
    },
    {
      id: "managing",
      title: "Managing cookies",
      body: [
        "Your browser can block or delete cookies for any site. Blocking Medicore's session cookie means sign-in cannot work: you will be returned to the sign-in page on every request. Deleting it signs you out.",
        `If you would rather use the clinic without any cookie at all, contact the clinic at ${CONTACT_EMAIL} and it will arrange your care by phone or in person.`,
      ],
    },
  ],
};

export const LEGAL_DOCUMENTS: LegalDocument[] = [PRIVACY_POLICY, TERMS_OF_USE, COOKIE_POLICY];
