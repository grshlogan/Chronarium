import type {
  ArchiveValidationIssue,
  ArchiveValidationReport
} from "@chronarium/archive";
import {
  parseDiagnosticDurationMismatchPayloadV1,
  parseDiagnosticMediaToolOutputPayloadV1,
  parseMediaGapDetectedPayloadV1
} from "@chronarium/schemas";
import type { JsonObject, JsonValue, TimelineEventEnvelope } from "@chronarium/types";
import type { CoreArchiveIndexService } from "../archiveIndexService.js";
import type {
  MaintenanceActionSuggestion,
  MaintenanceEvidence,
  MaintenanceFinding,
  MaintenanceReport,
  MaintenanceReportStatus,
  MaintenanceSeverity
} from "./inspectionTypes.js";

export interface ArchiveMaintenanceInspectorOptions {
  readonly service: CoreArchiveIndexService;
}

export interface ArchiveMaintenanceInspector {
  inspectArchive(archiveRootPath: string): Promise<MaintenanceReport>;
}

export function createArchiveMaintenanceInspector(
  options: ArchiveMaintenanceInspectorOptions
): ArchiveMaintenanceInspector {
  return new DefaultArchiveMaintenanceInspector(options.service);
}

class DefaultArchiveMaintenanceInspector implements ArchiveMaintenanceInspector {
  constructor(private readonly service: CoreArchiveIndexService) {}

  async inspectArchive(archiveRootPath: string): Promise<MaintenanceReport> {
    const inspectedAt = new Date().toISOString();
    const validation = await this.service.validateArchive(archiveRootPath);
    const findings = [
      ...createValidationFindings(validation, inspectedAt),
      ...createTimelineDiagnosticFindings(validation, inspectedAt)
    ];

    return createReport({
      archiveRootPath,
      inspectedAt,
      findings
    });
  }
}

function createValidationFindings(
  validation: ArchiveValidationReport,
  inspectedAt: string
): readonly MaintenanceFinding[] {
  return validation.issues.map((issue, index) => ({
    id: createFindingId(["archive-validator", issue.code, String(index + 1)]),
    domain: "archive",
    severity: issue.severity,
    status: "open",
    title: createValidationTitle(issue),
    summary: issue.message,
    evidence: [createValidationEvidence(issue)],
    suggestedActions: [createInspectArchiveAction()],
    firstSeenAt: inspectedAt,
    lastSeenAt: inspectedAt
  }));
}

function createTimelineDiagnosticFindings(
  validation: ArchiveValidationReport,
  inspectedAt: string
): readonly MaintenanceFinding[] {
  return validation.timelineEvents.flatMap((event) => {
    switch (event.type) {
      case "media.gap.detected":
        if (!tryParsePayload(parseMediaGapDetectedPayloadV1, event.payload)) {
          return [];
        }
        return [
          createTimelineFinding({
            event,
            inspectedAt,
            severity: payloadSeverity(event.payload, "warning"),
            title: "Media gap detected",
            summaryFallback: "The timeline contains a media gap diagnostic.",
            action: createInspectTimelineAction()
          })
        ];
      case "diagnostic.duration_mismatch":
        if (
          !tryParsePayload(
            parseDiagnosticDurationMismatchPayloadV1,
            event.payload
          )
        ) {
          return [];
        }
        return [
          createTimelineFinding({
            event,
            inspectedAt,
            severity: payloadSeverity(event.payload, "warning"),
            title: "Media duration mismatch",
            summaryFallback:
              "The timeline contains a media duration mismatch diagnostic.",
            action: createInspectTimelineAction()
          })
        ];
      case "diagnostic.media_tool_output":
        if (
          !tryParsePayload(
            parseDiagnosticMediaToolOutputPayloadV1,
            event.payload
          )
        ) {
          return [];
        }
        return [
          createTimelineFinding({
            event,
            inspectedAt,
            severity: payloadSeverity(event.payload, "warning"),
            title: "Media tool diagnostic",
            summaryFallback: "The timeline contains a media tool diagnostic.",
            action: createInspectTimelineAction()
          })
        ];
      default:
        return [];
    }
  });
}

function tryParsePayload<TPayload>(
  parsePayload: (value: unknown) => TPayload,
  payload: unknown
): TPayload | undefined {
  try {
    return parsePayload(payload);
  } catch {
    return undefined;
  }
}

function createTimelineFinding(input: {
  readonly event: TimelineEventEnvelope;
  readonly inspectedAt: string;
  readonly severity: MaintenanceSeverity;
  readonly title: string;
  readonly summaryFallback: string;
  readonly action: MaintenanceActionSuggestion;
}): MaintenanceFinding {
  const code = optionalPayloadString(input.event.payload, "code");
  const message = optionalPayloadString(input.event.payload, "message");

  return {
    id: createFindingId([
      "timeline",
      input.event.type,
      code ?? "uncoded",
      input.event.eventId
    ]),
    domain: eventDomain(input.event.type),
    severity: input.severity,
    status: "open",
    title: input.title,
    summary: message ?? input.summaryFallback,
    evidence: [createTimelineEvidence(input.event)],
    suggestedActions: [input.action],
    firstSeenAt: input.inspectedAt,
    lastSeenAt: input.inspectedAt
  };
}

function createValidationEvidence(
  issue: ArchiveValidationIssue
): MaintenanceEvidence {
  return {
    source: "archive-validator",
    code: issue.code,
    message: issue.message,
    ...(issue.path ? { path: issue.path } : {}),
    ...(issue.eventId ? { eventId: issue.eventId } : {}),
    ...(issue.sequence === undefined ? {} : { sequence: issue.sequence }),
    details: {
      severity: issue.severity,
      ...(issue.line === undefined ? {} : { line: issue.line }),
      ...(issue.trackId ? { trackId: issue.trackId } : {})
    }
  };
}

function createTimelineEvidence(
  event: TimelineEventEnvelope
): MaintenanceEvidence {
  const code = optionalPayloadString(event.payload, "code");
  const message =
    optionalPayloadString(event.payload, "message") ??
    `Timeline event ${event.type} was observed.`;
  const evidenceLevel = optionalPayloadString(event.payload, "evidenceLevel");

  return {
    source: "timeline",
    message,
    ...(code ? { code } : {}),
    eventId: event.eventId,
    sequence: event.sequence,
    eventType: event.type,
    ...(evidenceLevel ? { evidenceLevel } : {}),
    details: {
      capturedAt: event.capturedAt,
      ...(event.monotonicMs === undefined ? {} : { monotonicMs: event.monotonicMs }),
      payload: event.payload
    }
  };
}

function createReport(input: {
  readonly archiveRootPath: string;
  readonly inspectedAt: string;
  readonly findings: readonly MaintenanceFinding[];
}): MaintenanceReport {
  const errorCount = input.findings.filter(
    (finding) => finding.severity === "error" || finding.severity === "critical"
  ).length;
  const warningCount = input.findings.filter(
    (finding) => finding.severity === "warning"
  ).length;
  const infoCount = input.findings.filter(
    (finding) => finding.severity === "info"
  ).length;

  return {
    schemaVersion: 1,
    inspectedAt: input.inspectedAt,
    archiveRootPath: input.archiveRootPath,
    status: reportStatus({
      errorCount,
      warningCount
    }),
    summary: {
      findingCount: input.findings.length,
      errorCount,
      warningCount,
      infoCount
    },
    findings: input.findings
  };
}

function reportStatus(input: {
  readonly errorCount: number;
  readonly warningCount: number;
}): MaintenanceReportStatus {
  if (input.errorCount > 0) {
    return "error";
  }

  if (input.warningCount > 0) {
    return "warning";
  }

  return "healthy";
}

function payloadSeverity(
  payload: JsonObject,
  fallback: MaintenanceSeverity
): MaintenanceSeverity {
  const value = optionalPayloadString(payload, "level");
  switch (value) {
    case "info":
    case "warning":
    case "error":
    case "critical":
      return value;
    default:
      return fallback;
  }
}

function eventDomain(eventType: string): "archive" | "media" {
  return eventType.startsWith("media.") ||
    eventType.startsWith("diagnostic.")
    ? "media"
    : "archive";
}

function optionalPayloadString(
  payload: JsonObject,
  key: string
): string | undefined {
  const value: JsonValue | undefined = payload[key];
  return typeof value === "string" ? value : undefined;
}

function createValidationTitle(issue: ArchiveValidationIssue): string {
  switch (issue.code) {
    case "track.missing_file":
      return "Media track metadata is missing";
    case "timeline.sequence_gap":
      return "Timeline sequence gap";
    case "timeline.duplicate_event_id":
      return "Duplicate timeline event";
    case "manifest.schema_invalid":
      return "Archive manifest schema is invalid";
    default:
      return "Archive validation issue";
  }
}

function createInspectArchiveAction(): MaintenanceActionSuggestion {
  return {
    id: "inspect-archive-manually",
    label: "Inspect archive",
    safetyLevel: "report-only",
    summary: "Review the archive validation issue before attempting repair."
  };
}

function createInspectTimelineAction(): MaintenanceActionSuggestion {
  return {
    id: "inspect-timeline-facts",
    label: "Inspect timeline facts",
    safetyLevel: "report-only",
    summary: "Review the diagnostic timeline evidence before taking action."
  };
}

function createFindingId(parts: readonly string[]): string {
  return parts
    .map((part) => part.toLowerCase().replace(/[^a-z0-9_.-]+/g, "-"))
    .join(":");
}
