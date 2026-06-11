import {
  type ArchiveValidationIssue,
  validateFileArchive
} from "@chronarium/archive";
import type { TimelineEventEnvelope } from "@chronarium/types";
import { DatabaseSync } from "node:sqlite";
import { initializeIndexSchema } from "./schema.js";

export interface ChronariumIndexOptions {
  readonly databasePath: string;
}

export interface ArchiveIndexSummary {
  readonly archiveId: string;
  readonly sessionId: string;
  readonly archiveRootPath: string;
  readonly validationOk: boolean;
  readonly timelineEventCount: number;
  readonly validationIssueCount: number;
}

export interface IndexedArchive {
  readonly archiveId: string;
  readonly sessionId: string;
  readonly archiveRootPath: string;
  readonly siteId: string;
  readonly sessionStatus: string;
  readonly sessionCreatedAt: string;
  readonly archiveCreatedAt: string;
  readonly archiveUpdatedAt: string;
  readonly timelineEventCount: number;
  readonly timelineLastSequence?: number;
  readonly validationOk: boolean;
  readonly indexedAt: string;
}

export interface IndexedTimelineEvent {
  readonly archiveId: string;
  readonly eventId: string;
  readonly sessionId: string;
  readonly sequence: number;
  readonly type: string;
  readonly capturedAt: string;
  readonly sourceTime?: string;
  readonly sensitivity: string;
  readonly payloadJson: string;
}

export interface IndexedArchiveValidationIssue {
  readonly id: number;
  readonly archiveId: string;
  readonly sessionId: string;
  readonly severity: string;
  readonly code: string;
  readonly message: string;
  readonly path?: string;
  readonly line?: number;
  readonly eventId?: string;
  readonly sequence?: number;
}

export interface ChronariumIndex {
  readonly databasePath: string;
  indexArchiveFromPath(archiveRootPath: string): Promise<ArchiveIndexSummary>;
  getArchive(archiveId: string): IndexedArchive | undefined;
  listArchives(): readonly IndexedArchive[];
  listTimelineEvents(input: {
    readonly sessionId: string;
  }): readonly IndexedTimelineEvent[];
  listValidationIssues(input: {
    readonly archiveId: string;
  }): readonly IndexedArchiveValidationIssue[];
  close(): void;
}

export function openChronariumIndex(
  options: ChronariumIndexOptions
): ChronariumIndex {
  const database = new DatabaseSync(options.databasePath);
  initializeIndexSchema(database);

  return new SqliteChronariumIndex(options.databasePath, database);
}

class SqliteChronariumIndex implements ChronariumIndex {
  readonly databasePath: string;

  constructor(
    databasePath: string,
    private readonly database: DatabaseSync
  ) {
    this.databasePath = databasePath;
  }

  async indexArchiveFromPath(
    archiveRootPath: string
  ): Promise<ArchiveIndexSummary> {
    const report = await validateFileArchive({
      rootPath: archiveRootPath
    });

    if (!report.manifest) {
      throw new Error("Cannot index archive without a valid manifest.");
    }

    const { manifest } = report;
    const indexedAt = new Date().toISOString();

    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database
        .prepare(
          "DELETE FROM archives WHERE archive_id = ? OR archive_root_path = ?"
        )
        .run(manifest.archiveId, archiveRootPath);

      this.database
        .prepare(
          `
            INSERT INTO archives (
              archive_id,
              session_id,
              archive_root_path,
              site_id,
              session_status,
              session_created_at,
              archive_created_at,
              archive_updated_at,
              timeline_event_count,
              timeline_last_sequence,
              validation_ok,
              indexed_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `
        )
        .run(
          manifest.archiveId,
          manifest.session.id,
          archiveRootPath,
          manifest.session.site.siteId,
          manifest.session.status,
          manifest.session.createdAt,
          manifest.createdAt,
          manifest.updatedAt,
          report.timelineEvents.length,
          manifest.timeline.lastSequence ?? null,
          report.ok ? 1 : 0,
          indexedAt
        );

      this.insertTimelineEvents(manifest.archiveId, report.timelineEvents);
      this.insertValidationIssues(
        manifest.archiveId,
        manifest.session.id,
        report.issues
      );
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }

    return {
      archiveId: manifest.archiveId,
      sessionId: manifest.session.id,
      archiveRootPath,
      validationOk: report.ok,
      timelineEventCount: report.timelineEvents.length,
      validationIssueCount: report.issues.length
    };
  }

  getArchive(archiveId: string): IndexedArchive | undefined {
    const row = this.database
      .prepare("SELECT * FROM archives WHERE archive_id = ?")
      .get(archiveId);

    return row ? mapArchiveRow(row) : undefined;
  }

  listArchives(): readonly IndexedArchive[] {
    const rows = this.database
      .prepare(
        `
          SELECT *
          FROM archives
          ORDER BY archive_created_at, archive_id
        `
      )
      .all();

    return rows.map(mapArchiveRow);
  }

  listTimelineEvents(input: {
    readonly sessionId: string;
  }): readonly IndexedTimelineEvent[] {
    const rows = this.database
      .prepare(
        `
          SELECT *
          FROM timeline_events
          WHERE session_id = ?
          ORDER BY sequence, id
        `
      )
      .all(input.sessionId);

    return rows.map(mapTimelineEventRow);
  }

  listValidationIssues(input: {
    readonly archiveId: string;
  }): readonly IndexedArchiveValidationIssue[] {
    const rows = this.database
      .prepare(
        `
          SELECT *
          FROM archive_validation_issues
          WHERE archive_id = ?
          ORDER BY id
        `
      )
      .all(input.archiveId);

    return rows.map(mapValidationIssueRow);
  }

  close(): void {
    this.database.close();
  }

  private insertTimelineEvents(
    archiveId: string,
    events: readonly TimelineEventEnvelope[]
  ): void {
    const statement = this.database.prepare(
      `
        INSERT INTO timeline_events (
          archive_id,
          event_id,
          session_id,
          sequence,
          type,
          captured_at,
          source_time,
          sensitivity,
          payload_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    );

    events.forEach((event) => {
      statement.run(
        archiveId,
        event.eventId,
        event.sessionId,
        event.sequence,
        event.type,
        event.capturedAt,
        event.sourceTime ?? null,
        event.sensitivity,
        JSON.stringify(event.payload)
      );
    });
  }

  private insertValidationIssues(
    archiveId: string,
    sessionId: string,
    issues: readonly ArchiveValidationIssue[]
  ): void {
    const statement = this.database.prepare(
      `
        INSERT INTO archive_validation_issues (
          archive_id,
          session_id,
          severity,
          code,
          message,
          path,
          line,
          event_id,
          sequence
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    );

    issues.forEach((issue) => {
      statement.run(
        archiveId,
        sessionId,
        issue.severity,
        issue.code,
        issue.message,
        issue.path ?? null,
        issue.line ?? null,
        issue.eventId ?? null,
        issue.sequence ?? null
      );
    });
  }
}

function mapArchiveRow(row: unknown): IndexedArchive {
  const record = requireRecord(row);
  const timelineLastSequence = optionalNumber(record.timeline_last_sequence);

  return {
    archiveId: requireString(record.archive_id),
    sessionId: requireString(record.session_id),
    archiveRootPath: requireString(record.archive_root_path),
    siteId: requireString(record.site_id),
    sessionStatus: requireString(record.session_status),
    sessionCreatedAt: requireString(record.session_created_at),
    archiveCreatedAt: requireString(record.archive_created_at),
    archiveUpdatedAt: requireString(record.archive_updated_at),
    timelineEventCount: requireNumber(record.timeline_event_count),
    ...(timelineLastSequence === undefined ? {} : { timelineLastSequence }),
    validationOk: requireNumber(record.validation_ok) === 1,
    indexedAt: requireString(record.indexed_at)
  };
}

function mapTimelineEventRow(row: unknown): IndexedTimelineEvent {
  const record = requireRecord(row);
  const sourceTime = optionalString(record.source_time);

  return {
    archiveId: requireString(record.archive_id),
    eventId: requireString(record.event_id),
    sessionId: requireString(record.session_id),
    sequence: requireNumber(record.sequence),
    type: requireString(record.type),
    capturedAt: requireString(record.captured_at),
    ...(sourceTime === undefined ? {} : { sourceTime }),
    sensitivity: requireString(record.sensitivity),
    payloadJson: requireString(record.payload_json)
  };
}

function mapValidationIssueRow(row: unknown): IndexedArchiveValidationIssue {
  const record = requireRecord(row);
  const issuePath = optionalString(record.path);
  const line = optionalNumber(record.line);
  const eventId = optionalString(record.event_id);
  const sequence = optionalNumber(record.sequence);

  return {
    id: requireNumber(record.id),
    archiveId: requireString(record.archive_id),
    sessionId: requireString(record.session_id),
    severity: requireString(record.severity),
    code: requireString(record.code),
    message: requireString(record.message),
    ...(issuePath === undefined ? {} : { path: issuePath }),
    ...(line === undefined ? {} : { line }),
    ...(eventId === undefined ? {} : { eventId }),
    ...(sequence === undefined ? {} : { sequence })
  };
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Expected a SQLite result row object.");
  }

  return value as Record<string, unknown>;
}

function requireString(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error(`Expected SQLite string value, got ${typeof value}.`);
  }

  return value;
}

function requireNumber(value: unknown): number {
  if (typeof value !== "number") {
    throw new Error(`Expected SQLite number value, got ${typeof value}.`);
  }

  return value;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}
