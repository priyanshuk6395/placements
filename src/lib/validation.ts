import { z } from "zod";
import { isIP } from "node:net";

// Placement schema for direct POST
export const placementSchema = z.object({
  name: z.string().min(1).max(255),
  enrollmentNo: z.string().min(1).max(50),
  gender: z.enum(["Male", "Female", "Other"]).default("Male"),
  branch: z.string().min(1).max(100),
  company: z.string().min(1).max(255),
  offerType: z.string().default("Full-Time"),
  website: z.string().url().optional().or(z.literal("")),
  ctc: z.number().min(0).default(0),
  stipend: z.number().min(0).default(0),
  date: z.string().regex(/^\d{2}-\d{2}-\d{4}$|^TBD$/).default("TBD"),
  linkedin: z.string().url().optional().or(z.literal("")),
  batchYear: z.number().int().min(2000).max(2100),
});

export const visitorSchema = z.object({
  name: z.string().min(1).max(255),
  ip: z.string().refine((value) => isIP(value) !== 0, "Invalid IP address").optional(), // IP can be populated server-side
});

export const fileUploadSchema = z.object({
  batch: z.string().regex(/^\d{4}-\d{4}$/), // e.g., "2024-2025"
});

export type PlacementInput = z.infer<typeof placementSchema>;
export type VisitorInput = z.infer<typeof visitorSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
