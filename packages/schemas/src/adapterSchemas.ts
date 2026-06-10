import type {
  AdapterToCoreMessage,
  CoreToAdapterMessage
} from "@chronarium/types";
import { z } from "zod";
import {
  isoDateTimeStringSchema,
  jsonValueSchema,
  redactionStatusSchema
} from "./primitiveSchemas.js";
import { timelineEventEnvelopeV1Schema } from "./timelineSchemas.js";

const adapterCapabilitySchema = z.enum([
  "fixture.timeline",
  "media.discovery",
  "room.state",
  "chat.events",
  "diagnostics"
]);

const adapterRuntimeModeSchema = z.enum(["fixture", "live"]);

export const adapterProtocolMessageBaseV1Schema = z
  .object({
    protocolVersion: z.literal(1),
    messageId: z.string().min(1),
    correlationId: z.string().min(1).optional(),
    adapterId: z.string().min(1),
    sessionId: z.string().min(1).optional(),
    type: z.string().min(1),
    sentAt: isoDateTimeStringSchema
  })
  .strict();

const adapterMessageBaseFor = <TType extends string>(type: TType) =>
  adapterProtocolMessageBaseV1Schema.extend({
    type: z.literal(type)
  });

export const adapterStartCommandV1Schema = adapterMessageBaseFor(
  "adapter.start"
)
  .extend({
    sessionId: z.string().min(1),
    mode: adapterRuntimeModeSchema,
    capabilitiesRequested: z.array(adapterCapabilitySchema).readonly()
  })
  .strict();

export const adapterStopCommandV1Schema = adapterMessageBaseFor(
  "adapter.stop"
)
  .extend({
    reason: z.string().min(1)
  })
  .strict();

export const adapterFixtureLoadCommandV1Schema = adapterMessageBaseFor(
  "fixture.load"
)
  .extend({
    sessionId: z.string().min(1),
    fixtureRef: z
      .object({
        name: z.string().min(1),
        rootRelativePath: z.string().min(1).optional(),
        syntheticOnly: z.literal(true)
      })
      .strict()
  })
  .strict();

export const adapterHealthPingV1Schema = adapterMessageBaseFor("health.ping")
  .extend({
    nonce: z.string().min(1)
  })
  .strict();

export const coreToAdapterMessageV1Schema = z.discriminatedUnion("type", [
  adapterStartCommandV1Schema,
  adapterStopCommandV1Schema,
  adapterFixtureLoadCommandV1Schema,
  adapterHealthPingV1Schema
]);

export const adapterReadyEventV1Schema = adapterMessageBaseFor("adapter.ready")
  .extend({
    mode: adapterRuntimeModeSchema,
    capabilities: z.array(adapterCapabilitySchema).readonly()
  })
  .strict();

export const adapterTimelineFactMessageV1Schema = adapterMessageBaseFor(
  "fact.timeline"
)
  .extend({
    sessionId: z.string().min(1),
    event: timelineEventEnvelopeV1Schema
  })
  .strict();

export const adapterDiagnosticMessageV1Schema = adapterMessageBaseFor(
  "diagnostic.event"
)
  .extend({
    level: z.enum(["debug", "info", "warn", "error"]),
    message: z.string().min(1),
    details: z.record(z.string(), jsonValueSchema).optional(),
    redactionStatus: redactionStatusSchema
  })
  .strict();

export const adapterErrorMessageV1Schema = adapterMessageBaseFor("adapter.error")
  .extend({
    code: z.string().min(1),
    message: z.string().min(1),
    retryable: z.boolean(),
    redactionStatus: redactionStatusSchema
  })
  .strict();

export const adapterFinishedMessageV1Schema = adapterMessageBaseFor(
  "adapter.finished"
)
  .extend({
    reason: z.enum(["completed", "stopped", "failed"]),
    summary: z.record(z.string(), jsonValueSchema)
  })
  .strict();

export const adapterHealthPongV1Schema = adapterMessageBaseFor("health.pong")
  .extend({
    nonce: z.string().min(1)
  })
  .strict();

export const adapterToCoreMessageV1Schema = z.discriminatedUnion("type", [
  adapterReadyEventV1Schema,
  adapterTimelineFactMessageV1Schema,
  adapterDiagnosticMessageV1Schema,
  adapterErrorMessageV1Schema,
  adapterFinishedMessageV1Schema,
  adapterHealthPongV1Schema
]);

export const adapterProtocolMessageV1Schema =
  z.union([coreToAdapterMessageV1Schema, adapterToCoreMessageV1Schema]);

export function parseCoreToAdapterMessageV1(
  value: unknown
): CoreToAdapterMessage {
  return coreToAdapterMessageV1Schema.parse(value) as CoreToAdapterMessage;
}

export function parseAdapterToCoreMessageV1(
  value: unknown
): AdapterToCoreMessage {
  return adapterToCoreMessageV1Schema.parse(value) as AdapterToCoreMessage;
}
