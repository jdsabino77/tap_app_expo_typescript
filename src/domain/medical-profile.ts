import { z } from "zod";
import { calculateAge } from "../lib/age";

export const skinTypeSchema = z.enum([
  "type1",
  "type2",
  "type3",
  "type4",
  "type5",
  "type6",
]);
export type SkinType = z.infer<typeof skinTypeSchema>;

export const ethnicitySchema = z.enum([
  "caucasian",
  "african",
  "asian",
  "hispanic",
  "middleEastern",
  "nativeAmerican",
  "pacificIslander",
  "mixed",
  "other",
  "preferNotToSay",
]);
export type Ethnicity = z.infer<typeof ethnicitySchema>;

export const genderSchema = z.enum(["male", "female", "nonBinary", "other", "preferNotToSay"]);
export type Gender = z.infer<typeof genderSchema>;

export const medicalProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  dateOfBirth: z.coerce.date(),
  gender: genderSchema,
  ethnicity: ethnicitySchema,
  skinType: skinTypeSchema,
  allergies: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),
  medicalConditions: z.array(z.string()).default([]),
  previousTreatments: z.array(z.string()).default([]),
  notes: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type MedicalProfile = z.infer<typeof medicalProfileSchema>;

export function parseMedicalProfile(input: unknown): MedicalProfile {
  return medicalProfileSchema.parse(input);
}

export function medicalProfileAge(profile: MedicalProfile, now?: Date): number {
  return calculateAge(profile.dateOfBirth, now);
}

const SKIN_TYPE_LABELS: Record<SkinType, string> = {
  type1: "Type I - Very fair, always burns, never tans",
  type2: "Type II - Fair, usually burns, tans minimally",
  type3: "Type III - Medium, sometimes burns, tans gradually",
  type4: "Type IV - Olive, rarely burns, tans easily",
  type5: "Type V - Brown, very rarely burns, tans very easily",
  type6: "Type VI - Dark brown/black, never burns, tans very easily",
};

const ETHNICITY_LABELS: Record<Ethnicity, string> = {
  caucasian: "Caucasian",
  african: "African/African American",
  asian: "Asian",
  hispanic: "Hispanic/Latino",
  middleEastern: "Middle Eastern",
  nativeAmerican: "Native American",
  pacificIslander: "Pacific Islander",
  mixed: "Mixed/Multiracial",
  other: "Other",
  preferNotToSay: "Prefer not to say",
};

const GENDER_LABELS: Record<Gender, string> = {
  male: "Male",
  female: "Female",
  nonBinary: "Non-binary",
  other: "Other",
  preferNotToSay: "Prefer not to say",
};

export function skinTypeDescription(skinType: SkinType): string {
  return SKIN_TYPE_LABELS[skinType];
}

export function ethnicityDisplayName(ethnicity: Ethnicity): string {
  return ETHNICITY_LABELS[ethnicity];
}

export function genderDisplayName(gender: Gender): string {
  return GENDER_LABELS[gender];
}
