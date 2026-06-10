import type { LiveSession } from "@chronarium/types";
import { z } from "zod";
import { isoDateTimeStringSchema, redactionStatusSchema } from "./primitiveSchemas.js";

export const liveSessionStatusSchema = z.enum([
  "planned",
  "capturing",
  "paused",
  "ended",
  "failed",
  "imported"
]);

export const liveSessionSiteRefSchema = z
  .object({
    siteId: z.string().min(1),
    roomIdHash: z.string().min(1).optional(),
    roomDisplayName: z.string().min(1).optional(),
    redactionStatus: redactionStatusSchema
  })
  .strict();

export const liveSessionV1Schema = z
  .object({
    id: z.string().min(1),
    schemaVersion: z.literal(1),
    site: liveSessionSiteRefSchema,
    createdAt: isoDateTimeStringSchema,
    startedAt: isoDateTimeStringSchema.optional(),
    endedAt: isoDateTimeStringSchema.optional(),
    status: liveSessionStatusSchema,
    title: z.string().min(1).optional(),
    tags: z.array(z.string().min(1)).readonly().optional()
  })
  .strict();

export function parseLiveSessionV1(value: unknown): LiveSession {
  return liveSessionV1Schema.parse(value) as LiveSession;
}
