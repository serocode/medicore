import { DEMO_OTP } from "@healthcare/dal";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { db } from "./db.js";
import { sendOtpEmail } from "./email.js";
import { env } from "./env.js";
import { doctorRepository, nurseRepository, staffAccountRepository } from "./repos.js";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.WEB_ORIGIN],
  emailAndPassword: {
    enabled: false,
  },
  // Default (unset `enabled`): Better Auth only rate-limits in production,
  // so local dev and the test suite's rapid sign-ins are unaffected. The two
  // OTP endpoints get tighter limits than the framework default (10s/100req)
  // since they're the only unauthenticated, abuse-prone surface here —
  // request-OTP could otherwise be used to spam a victim's inbox, and
  // verify-OTP is a 6-digit brute-force target.
  rateLimit: {
    customRules: {
      "/email-otp/send-verification-otp": { window: 60, max: 3 },
      "/sign-in/email-otp": { window: 60, max: 5 },
    },
  },
  user: {
    additionalFields: {
      // Server-assigned only — never accept a client-supplied role.
      role: { type: "string", input: false, defaultValue: "patient" },
      // Server-assigned only, see requireAuth — a disabled account can't
      // authenticate even with a still-valid session cookie.
      disabledAt: { type: "date", input: false, required: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        async before(user) {
          const email = user.email?.toLowerCase();
          if (!email) return;
          if (env.adminEmails.has(email)) return { data: { ...user, role: "admin" } };
          if (env.doctorEmails.has(email)) return { data: { ...user, role: "doctor" } };
          if (env.nurseEmails.has(email)) return { data: { ...user, role: "nurse" } };
          // Runtime-managed alternative to the env allowlists above — see
          // packages/dal/src/schema/staff-invite.ts. Checked last so an env
          // allowlist entry always wins if both somehow name the same email.
          const invite = await staffAccountRepository.findInvite(email);
          if (invite) return { data: { ...user, role: invite.role } };
          return;
        },
        // Staff accounts bootstrap via an env allowlist or an admin-created
        // invite (see `before` above) rather than a self-service
        // registration form, so the minimal professional profile row is
        // auto-provisioned here — the staff member fills in the rest via
        // their profile page afterward.
        async after(user) {
          const role = (user as { role?: string }).role;
          const displayName = user.name || user.email;
          const email = user.email?.toLowerCase();
          if (email && (await staffAccountRepository.findInvite(email))) {
            await staffAccountRepository.deleteInvite(email);
          }
          if (role === "doctor" && !(await doctorRepository.findByUserId(user.id))) {
            await doctorRepository.create({
              userId: user.id,
              name: displayName,
              specialization: "General Practice",
              imageUrl: null,
              title: null,
              department: null,
              licenseNumber: null,
              contactPhone: null,
              bio: null,
              yearsOfExperience: null,
            });
          } else if (role === "nurse" && !(await nurseRepository.findByUserId(user.id))) {
            await nurseRepository.create({
              userId: user.id,
              name: displayName,
              title: null,
              department: null,
              licenseNumber: null,
              contactPhone: null,
              bio: null,
              imageUrl: null,
            });
          }
        },
      },
    },
  },
  plugins: [
    emailOTP({
      // Stated rather than inherited (this equals Better Auth's default): the
      // sign-in page restores a pending code for exactly this long after
      // sending it, so the two have to agree. Keep OTP_VALIDITY_MS in
      // apps/web/src/features/auth/pages/SignInPage.tsx in step with any change here.
      expiresIn: 300,
      // Demo mode swaps the random code for a fixed, published one so the app
      // can be demonstrated without an inbox — the verification step itself is
      // untouched, so every other part of the flow behaves exactly as it does
      // in production. env.ts refuses to let DEMO_MODE be set there.
      ...(env.DEMO_MODE ? { generateOTP: () => DEMO_OTP } : {}),
      async sendVerificationOTP({ email, otp }) {
        await sendOtpEmail(email, otp);
      },
    }),
  ],
});
