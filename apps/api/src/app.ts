import { checkDbConnection } from "@healthcare/dal";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { auth } from "./auth.js";
import { db } from "./db.js";
import { env } from "./env.js";
import { mapErrorToResponse } from "./lib/http-errors.js";
import { adminRoute } from "./routes/admin.js";
import { appointmentsRoute } from "./routes/appointments.js";
import { doctorsRoute } from "./routes/doctors.js";
import { encountersRoute } from "./routes/encounters.js";
import { labResultsDashboardRoute, labResultsRoute } from "./routes/lab-results.js";
import { labTestCatalogRoute } from "./routes/lab-test-catalog.js";
import { patientsRoute } from "./routes/patients.js";
import { staffRoute } from "./routes/staff.js";
import { uploadsRoute } from "./routes/uploads.js";

export const app = new Hono();

app.use("*", secureHeaders());
app.use(
  "*",
  cors({
    origin: env.WEB_ORIGIN,
    credentials: true,
  }),
);

app.get("/health", (c) => c.json({ status: "ok" }));

app.get("/ready", async (c) => {
  try {
    await checkDbConnection(db);
    return c.json({ status: "ok" });
  } catch (error) {
    console.error("Readiness check failed:", error);
    return c.json({ status: "unavailable" }, 503);
  }
});

app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.route("/api/doctors", doctorsRoute);
app.route("/api/patients", patientsRoute);
app.route("/api/patients", encountersRoute);
app.route("/api/patients", labResultsRoute);
app.route("/api/lab-results", labResultsDashboardRoute);
app.route("/api/lab-test-catalog", labTestCatalogRoute);
app.route("/api/appointments", appointmentsRoute);
app.route("/api/uploads", uploadsRoute);
app.route("/api/staff", staffRoute);
app.route("/api/admin", adminRoute);

app.onError((error, c) => mapErrorToResponse(error, c));

app.notFound((c) => c.json({ error: "Not Found" }, 404));
