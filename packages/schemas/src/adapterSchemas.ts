import { defineSchema } from "./schemaDefinition.js";

export const adapterProtocolMessageV1Schema = defineSchema({
  id: "chronarium.adapter.protocol-message.v1",
  version: 1,
  title: "Adapter Protocol Message V1",
  description: "Common envelope for core-adapter protocol messages.",
  kind: "json-schema-lite",
  schema: {
    type: "object",
    required: ["protocolVersion", "messageId", "adapterId", "type", "sentAt"],
    properties: {
      protocolVersion: { const: 1 },
      messageId: { type: "string" },
      correlationId: { type: "string" },
      adapterId: { type: "string" },
      sessionId: { type: "string" },
      type: { type: "string" },
      sentAt: { type: "string", format: "date-time" }
    }
  }
});
