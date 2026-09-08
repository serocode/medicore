import { checkDbConnection } from "@healthcare/dal";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { auth } from "./auth.js";
import { db } from "./db.js";
import { env } from "./env.js";
import { mapErrorToResponse } from "./lib/http-errors.js";
import { accountRoute } from "./routes/account.js";
import { adminRoute } from "./routes/admin.js";
import { appointmentsRoute } from "./routes/appointments.js";
import { demoRoute } from "./routes/demo.js";
import { doctorsRoute } from "./routes/doctors.js";
import { encountersRoute } from "./routes/encounters.js";
import { labResultsDashboardRoute, labResultsRoute } from "./routes/lab-results.js";
import { labTestCatalogRoute } from "./routes/lab-test-catalog.js";
import { patientsRoute } from "./routes/patients.js";
import { staffRoute } from "./routes/staff.js";
import { uploadsRoute } from "./routes/uploads.js";

export const app = new Hono();

// Uploaded images are rendered by <img> on the web origin, which is a
// different origin from the API. `secureHeaders()` defaults
// Cross-Origin-Resource-Policy to `same-origin`, and the browser blocks those
// loads (ERR_BLOCKED_BY_RESPONSE.NotSameOrigin) regardless of CORS, because an
// <img> load is a no-cors request that CORP is checked on separately. Only the
// upload-serving route opts down to `cross-origin`; every other response keeps
// the strict default. The files stay protected by the route's own auth and
// ownership checks, not by CORP.
const strictHeaders = secureHeaders();
const embeddableHeaders = secureHeaders({ crossOriginResourcePolicy: "cross-origin" });

app.use("*", (c, next) =>
  c.req.path.startsWith("/api/uploads/") ? embeddableHeaders(c, next) : strictHeaders(c, next),
);
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

app.route("/api/demo", demoRoute);
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
app.route("/api/account", accountRoute);

app.onError((error, c) => mapErrorToResponse(error, c));

app.notFound((c) => c.json({ error: "Not Found" }, 404));
