import { defineSchema } from "./schemaDefinition.js";

export const timelineEventEnvelopeV1Schema = defineSchema({
  id: "chronarium.timeline.event-envelope.v1",
  version: 1,
  title: "Timeline Event Envelope V1",
  description: "Common envelope for one append-friendly timeline fact.",
  kind: "json-schema-lite",
  schema: {
    type: "object",
    required: [
      "schemaVersion",
      "eventId",
      "sessionId",
      "type",
      "sequence",
      "capturedAt",
      "sensitivity",
      "payload"
    ],
    properties: {
      schemaVersion: { const: 1 },
      eventId: { type: "string" },
      sessionId: { type: "string" },
      type: { type: "string" },
      sequence: { type: "integer", minimum: 1 },
      capturedAt: { type: "string", format: "date-time" },
      sourceTime: { type: "string", format: "date-time" },
      monotonicMs: { type: "number", minimum: 0 },
      source: { type: "object" },
      sensitivity: {
        enum: ["safe", "synthetic", "redacted", "contains-sensitive", "unknown"]
      },
      payload: { type: "object" }
    }
  }
});
