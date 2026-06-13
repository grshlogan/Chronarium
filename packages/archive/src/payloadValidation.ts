import type { TimelineEventEnvelope } from "@chronarium/types";
import { validateTimelineEventPayloadV1 } from "@chronarium/schemas";
import type { ArchiveValidationIssue } from "./validator.js";

/**
 * Validate each timeline event payload against its per-family schema. Events
 * whose type has no registered payload schema pass through unvalidated. Mirrors
 * `validateTimelineMediaSegments`: returns issues, mutates nothing.
 */
export function validateTimelinePayloads(input: {
  readonly timelineEvents: readonly TimelineEventEnvelope[];
}): readonly ArchiveValidationIssue[] {
  const issues: ArchiveValidationIssue[] = [];

  for (const event of input.timelineEvents) {
    const payloadIssue = validateTimelineEventPayloadV1(event);
    if (payloadIssue) {
      issues.push({
        severity: "error",
        code: "payload.schema_invalid",
        eventId: event.eventId,
        sequence: event.sequence,
        message: `Timeline event payload failed schema validation: ${payloadIssue.message}`
      });
    }
  }

  return issues;
}
