import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { db } from "./db.js";
import { sendOtpEmail } from "./email.js";
import { env } from "./env.js";

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
    },
  },
  databaseHooks: {
    user: {
      create: {
        async before(user) {
          const email = user.email?.toLowerCase();
          if (email && env.adminEmails.has(email)) {
            return { data: { ...user, role: "admin" } };
          }
          return;
        },
      },
    },
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp }) {
        await sendOtpEmail(email, otp);
      },
    }),
  ],
});
