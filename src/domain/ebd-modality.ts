import { z } from "zod";

export const ebdModalitySchema = z.enum(["laser", "photofacial"]);
export type EbdModality = z.infer<typeof ebdModalitySchema>;
