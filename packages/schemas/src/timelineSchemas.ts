import type { TimelineEventEnvelope } from "@chronarium/types";
import { z } from "zod";
import {
  isoDateTimeStringSchema,
  jsonValueSchema,
  redactionStatusSchema
} from "./primitiveSchemas.js";

const timelineEventTypePattern =
  /^(session|adapter|media\.track|media\.segment|media\.gap|room|chat|paid_room|network|export|diagnostic)\.[A-Za-z0-9_.-]+$/;

export const timelineEventSourceV1Schema = z
  .object({
    adapterId: z.string().min(1).optional(),
    siteId: z.string().min(1).optional(),
    sourceIdHash: z.string().min(1).optional(),
    redactionStatus: redactionStatusSchema
  })
  .strict();

export const timelineEventEnvelopeV1Schema = z
  .object({
    schemaVersion: z.literal(1),
    eventId: z.string().min(1),
    sessionId: z.string().min(1),
    type: z.string().regex(timelineEventTypePattern),
    sequence: z.number().int().positive(),
    capturedAt: isoDateTimeStringSchema,
    sourceTime: isoDateTimeStringSchema.optional(),
    monotonicMs: z.number().nonnegative().optional(),
    source: timelineEventSourceV1Schema.optional(),
    sensitivity: redactionStatusSchema,
    payload: z.record(z.string(), jsonValueSchema)
  })
  .strict();

export function parseTimelineEventEnvelopeV1(
  value: unknown
): TimelineEventEnvelope {
  return timelineEventEnvelopeV1Schema.parse(value) as TimelineEventEnvelope;
}
