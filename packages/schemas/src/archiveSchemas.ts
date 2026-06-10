import type { ArchiveManifest } from "@chronarium/types";
import { z } from "zod";
import {
  isoDateTimeStringSchema,
  relativeArchivePathSchema
} from "./primitiveSchemas.js";
import { liveSessionV1Schema } from "./sessionSchemas.js";
import { mediaTrackV1Schema } from "./mediaSchemas.js";

export const archiveManifestPathsV1Schema = z
  .object({
    timeline: relativeArchivePathSchema,
    events: relativeArchivePathSchema,
    tracks: relativeArchivePathSchema,
    diagnostics: relativeArchivePathSchema,
    exports: relativeArchivePathSchema
  })
  .strict();

export const archiveTimelineIndexV1Schema = z
  .object({
    path: relativeArchivePathSchema,
    eventCount: z.number().int().nonnegative().optional(),
    lastSequence: z.number().int().positive().optional()
  })
  .strict();

export const archiveManifestV1Schema = z
  .object({
    archiveFormatVersion: z.literal(1),
    archiveId: z.string().min(1),
    session: liveSessionV1Schema,
    createdAt: isoDateTimeStringSchema,
    updatedAt: isoDateTimeStringSchema,
    schemaVersions: z
      .object({
        timeline: z.literal(1),
        adapterProtocol: z.literal(1)
      })
      .strict(),
    timeline: archiveTimelineIndexV1Schema,
    tracks: z.array(mediaTrackV1Schema).readonly(),
    paths: archiveManifestPathsV1Schema,
    generator: z
      .object({
        name: z.literal("chronarium"),
        version: z.string().min(1).optional()
      })
      .strict()
  })
  .strict();

export function parseArchiveManifestV1(value: unknown): ArchiveManifest {
  return archiveManifestV1Schema.parse(value) as ArchiveManifest;
}
