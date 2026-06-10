import { defineSchema } from "./schemaDefinition.js";

export const archiveManifestV1Schema = defineSchema({
  id: "chronarium.archive.manifest.v1",
  version: 1,
  title: "Archive Manifest V1",
  description: "Minimum manifest shape for a Chronarium .chron archive.",
  kind: "json-schema-lite",
  schema: {
    type: "object",
    required: [
      "archiveFormatVersion",
      "archiveId",
      "session",
      "createdAt",
      "updatedAt",
      "schemaVersions",
      "timeline",
      "tracks",
      "paths",
      "generator"
    ],
    properties: {
      archiveFormatVersion: { const: 1 },
      archiveId: { type: "string" },
      session: { type: "object" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
      schemaVersions: { type: "object" },
      timeline: { type: "object" },
      tracks: { type: "array" },
      paths: { type: "object" },
      generator: { type: "object" }
    }
  }
});
