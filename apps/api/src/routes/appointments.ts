import {
  PatientNotFoundError,
  bookAppointment,
  cancelAppointment,
  confirmAppointment,
  getAppointmentStats,
  getPatientByUserId,
  listAppointmentsWithDetails,
} from "@healthcare/application";
import type { Appointment } from "@healthcare/application";
import { Hono } from "hono";
import { z } from "zod";
import { sendAppointmentStatusEmail } from "../email.js";
import { requireAdmin } from "../middleware/require-admin.js";
import type { AuthVariables } from "../middleware/require-auth.js";
import { requireAuth } from "../middleware/require-auth.js";
import { appointmentRepository, patientRepository } from "../repos.js";

export const appointmentsRoute = new Hono<{ Variables: AuthVariables }>();

// Best-effort: a notification failure must never undo an already-applied
// confirm/cancel, so this only logs — it never throws back into the route.
async function notifyAppointmentStatus(
  appointment: Appointment,
  subject: string,
  message: string,
): Promise<void> {
  try {
    const email = await patientRepository.getContactEmail(appointment.patientId);
    if (email) {
      await sendAppointmentStatusEmail(email, subject, message);
    }
  } catch (error) {
    console.error("Failed to send appointment status email:", error);
  }
}

const appointmentStatusSchema = z.enum(["pending", "scheduled", "cancelled"]);

const bookAppointmentSchema = z.object({
  doctorId: z.string().uuid(),
  reason: z.string().min(1),
  preferredSchedule: z.coerce.date(),
  notes: z.string().optional(),
});

appointmentsRoute.post("/", requireAuth, async (c) => {
  const user = c.get("user");
  const patient = await getPatientByUserId(user.id, { patients: patientRepository });
  if (!patient) {
    throw new PatientNotFoundError();
  }

  const input = bookAppointmentSchema.parse(await c.req.json());
  const appointment = await bookAppointment(
    {
      patientId: patient.id,
      doctorId: input.doctorId,
      reason: input.reason,
      preferredSchedule: input.preferredSchedule,
      notes: input.notes,
    },
    { appointments: appointmentRepository },
  );

  return c.json({ appointment }, 201);
});

appointmentsRoute.get("/stats", requireAuth, requireAdmin, async (c) => {
  const stats = await getAppointmentStats({ appointments: appointmentRepository });
  return c.json({ stats });
});

appointmentsRoute.get("/", requireAuth, async (c) => {
  const user = c.get("user");
  const statusParam = c.req.query("status");
  const status = statusParam ? appointmentStatusSchema.parse(statusParam) : undefined;

  if (user.role === "admin") {
    const appointments = await listAppointmentsWithDetails(
      { status },
      { appointments: appointmentRepository },
    );
    return c.json({ appointments });
  }

  const patient = await getPatientByUserId(user.id, { patients: patientRepository });
  if (!patient) {
    return c.json({ appointments: [] });
  }

  const appointments = await listAppointmentsWithDetails(
    { patientId: patient.id, status },
    { appointments: appointmentRepository },
  );
  return c.json({ appointments });
});

const confirmAppointmentSchema = z.object({ scheduledAt: z.coerce.date() });

appointmentsRoute.patch("/:id/confirm", requireAuth, requireAdmin, async (c) => {
  const input = confirmAppointmentSchema.parse(await c.req.json());
  const appointment = await confirmAppointment(
    { appointmentId: c.req.param("id"), scheduledAt: input.scheduledAt },
    { appointments: appointmentRepository },
  );

  await notifyAppointmentStatus(
    appointment,
    "Your appointment is confirmed",
    `Your appointment ("${appointment.reason}") is confirmed for ${appointment.scheduledAt?.toLocaleString() ?? ""}.`,
  );

  return c.json({ appointment });
});

const cancelAppointmentSchema = z.object({ reason: z.string().min(1) });

appointmentsRoute.patch("/:id/cancel", requireAuth, requireAdmin, async (c) => {
  const input = cancelAppointmentSchema.parse(await c.req.json());
  const appointment = await cancelAppointment(
    { appointmentId: c.req.param("id"), reason: input.reason },
    { appointments: appointmentRepository },
  );

  await notifyAppointmentStatus(
    appointment,
    "Your appointment was cancelled",
    `Your appointment ("${appointment.reason}") was cancelled. Reason: ${appointment.cancellationReason}`,
  );

  return c.json({ appointment });
});
