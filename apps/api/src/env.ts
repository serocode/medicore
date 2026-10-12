import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
  WEB_ORIGIN: z.string().url().default("http://localhost:5173"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Healthcare <onboarding@resend.dev>"),
  ADMIN_EMAILS: z.string().optional(),
  DOCTOR_EMAILS: z.string().optional(),
  NURSE_EMAILS: z.string().optional(),
  // Demo mode: sign-in still goes through the normal email-OTP flow, but the
  // code is the fixed DEMO_OTP instead of a random one — so a demo can be
  // driven without an inbox. Refused outright in production below; this is a
  // deliberate hole in the only authentication factor the app has.
  DEMO_MODE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  // The single-value header a trusted proxy sets to the client's IP, used to
  // key Better Auth's rate limits. Unset, it reads X-Forwarded-For — which
  // behind Cloudflare Tunnel + Traefik carries two hops, so Better Auth can't
  // resolve an IP and every client shares one bucket. Production sets
  // "cf-connecting-ip" (see docker-compose.prod.yml). Only set this when the
  // API is unreachable except through that proxy, or the header is spoofable.
  CLIENT_IP_HEADER: z.string().optional(),
  UPLOAD_DIR: z.string().default("./uploads"),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().positive().default(5),
});

function loadEnv() {
  const parsed = envSchema
    .refine((env) => !(env.DEMO_MODE && env.NODE_ENV === "production"), {
      message: "DEMO_MODE cannot be enabled in production — it makes every sign-in code guessable",
      path: ["DEMO_MODE"],
    })
    .safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration");
  }
  return parsed.data;
}

const rawEnv = loadEnv();

function parseEmailAllowlist(value: string | undefined): Set<string> {
  return new Set(
    (value ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export const env = {
  ...rawEnv,
  adminEmails: parseEmailAllowlist(rawEnv.ADMIN_EMAILS),
  doctorEmails: parseEmailAllowlist(rawEnv.DOCTOR_EMAILS),
  nurseEmails: parseEmailAllowlist(rawEnv.NURSE_EMAILS),
};
