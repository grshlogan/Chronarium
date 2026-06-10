import type { MediaTrack } from "@chronarium/types";
import { z } from "zod";
import {
  isoDateTimeStringSchema,
  redactionStatusSchema,
  relativeArchivePathSchema
} from "./primitiveSchemas.js";

export const mediaTrackKindSchema = z.enum([
  "video",
  "audio",
  "subtitles",
  "data"
]);

export const mediaTrackSourceRefSchema = z
  .object({
    adapterId: z.string().min(1).optional(),
    siteId: z.string().min(1).optional(),
    sourceIdHash: z.string().min(1).optional(),
    redactionStatus: redactionStatusSchema
  })
  .strict();

export const mediaTrackV1Schema = z
  .object({
    id: z.string().min(1),
    sessionId: z.string().min(1),
    kind: mediaTrackKindSchema,
    label: z.string().min(1).optional(),
    codec: z.string().min(1).optional(),
    container: z.string().min(1).optional(),
    timeBase: z.string().min(1).optional(),
    source: mediaTrackSourceRefSchema.optional(),
    segmentsPath: relativeArchivePathSchema,
    createdAt: isoDateTimeStringSchema
  })
  .strict();

export function parseMediaTrackV1(value: unknown): MediaTrack {
  return mediaTrackV1Schema.parse(value) as MediaTrack;
}
