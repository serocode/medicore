import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [emailOTPClient()],
});

export const { useSession } = authClient;
