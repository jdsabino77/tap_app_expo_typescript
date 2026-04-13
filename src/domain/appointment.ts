import { z } from "zod";
import { ebdModalitySchema } from "./ebd-modality";
import { treatmentTypeSchema } from "./treatment";

export const appointmentKindSchema = z.enum(["consult", "treatment"]);
export type AppointmentKind = z.infer<typeof appointmentKindSchema>;

export const appointmentStatusSchema = z.enum(["scheduled", "cancelled", "completed"]);
export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;

export const appointmentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  appointmentKind: appointmentKindSchema,
  treatmentType: treatmentTypeSchema.nullable(),
  serviceType: z.string(),
  brand: z.string(),
  ebdIndicationId: z.string().nullable().optional().default(null),
  ebdModality: ebdModalitySchema.nullable().optional().default(null),
  ebdTreatmentCategory: z.string().optional().default(""),
  scheduledAt: z.coerce.date(),
  durationMinutes: z.number().int().positive().nullable(),
  providerId: z.string().nullable(),
  /** Resolved from `providers` join when loading from Supabase; omit when saving raw. */
  providerName: z.string().nullable().default(null),
  notes: z.string(),
  status: appointmentStatusSchema,
  externalRef: z.string().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export type Appointment = z.infer<typeof appointmentSchema>;

export function parseAppointment(input: unknown): Appointment {
  return appointmentSchema.parse(input);
}
