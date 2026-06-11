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

export interface ArchiveIndexQuery {
  readonly sessionId?: string;
  readonly siteId?: string;
  readonly validationOk?: boolean;
}

export interface TimelineEventIndexQuery {
  readonly archiveId?: string;
  readonly sessionId?: string;
  readonly type?: string;
}

export interface ValidationIssueIndexQuery {
  readonly archiveId?: string;
  readonly sessionId?: string;
  readonly severity?: string;
  readonly code?: string;
}

export interface RemoveArchiveFromIndexInput {
  readonly archiveId?: string;
  readonly archiveRootPath?: string;
}

export interface ArchiveIndexRemovalSummary {
  readonly removedArchiveCount: number;
}

export interface ArchiveIndexClearSummary {
  readonly removedArchiveCount: number;
}

export interface ChronariumIndex {
  readonly databasePath: string;
  indexArchiveFromPath(archiveRootPath: string): Promise<ArchiveIndexSummary>;
  reindexArchiveFromPath(archiveRootPath: string): Promise<ArchiveIndexSummary>;
  removeArchiveFromIndex(
    input: RemoveArchiveFromIndexInput
  ): ArchiveIndexRemovalSummary;
  clearIndex(): ArchiveIndexClearSummary;
  getArchive(archiveId: string): IndexedArchive | undefined;
  listArchives(input?: ArchiveIndexQuery): readonly IndexedArchive[];
  listTimelineEvents(
    input?: TimelineEventIndexQuery
  ): readonly IndexedTimelineEvent[];
  listValidationIssues(
    input?: ValidationIssueIndexQuery
  ): readonly IndexedArchiveValidationIssue[];
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
    return this.reindexArchiveFromPath(archiveRootPath);
  }

  async reindexArchiveFromPath(
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

  removeArchiveFromIndex(
    input: RemoveArchiveFromIndexInput
  ): ArchiveIndexRemovalSummary {
    const where = buildWhereClause([
      input.archiveId
        ? {
            sql: "archive_id = ?",
            value: input.archiveId
          }
        : undefined,
      input.archiveRootPath
        ? {
            sql: "archive_root_path = ?",
            value: input.archiveRootPath
          }
        : undefined
    ]);

    if (!where) {
      throw new Error(
        "removeArchiveFromIndex requires archiveId or archiveRootPath."
      );
    }

    const removedArchiveCount = this.countArchives(where);
    this.database.prepare(`DELETE FROM archives ${where.sql}`).run(...where.values);

    return {
      removedArchiveCount
    };
  }

  clearIndex(): ArchiveIndexClearSummary {
    const removedArchiveCount = this.countArchives();
    this.database.prepare("DELETE FROM archives").run();

    return {
      removedArchiveCount
    };
  }

  getArchive(archiveId: string): IndexedArchive | undefined {
    const row = this.database
      .prepare("SELECT * FROM archives WHERE archive_id = ?")
      .get(archiveId);

    return row ? mapArchiveRow(row) : undefined;
  }

  listArchives(input: ArchiveIndexQuery = {}): readonly IndexedArchive[] {
    const where = buildWhereClause([
      input.sessionId
        ? {
            sql: "session_id = ?",
            value: input.sessionId
          }
        : undefined,
      input.siteId
        ? {
            sql: "site_id = ?",
            value: input.siteId
          }
        : undefined,
      input.validationOk === undefined
        ? undefined
        : {
            sql: "validation_ok = ?",
            value: input.validationOk ? 1 : 0
          }
    ]);
    const rows = this.database
      .prepare(
        `
          SELECT *
          FROM archives
          ${where?.sql ?? ""}
          ORDER BY archive_created_at, archive_id
        `
      )
      .all(...(where?.values ?? []));

    return rows.map(mapArchiveRow);
  }

  listTimelineEvents(
    input: TimelineEventIndexQuery = {}
  ): readonly IndexedTimelineEvent[] {
    const where = buildWhereClause([
      input.archiveId
        ? {
            sql: "archive_id = ?",
            value: input.archiveId
          }
        : undefined,
      input.sessionId
        ? {
            sql: "session_id = ?",
            value: input.sessionId
          }
        : undefined,
      input.type
        ? {
            sql: "type = ?",
            value: input.type
          }
        : undefined
    ]);
    const rows = this.database
      .prepare(
        `
          SELECT *
          FROM timeline_events
          ${where?.sql ?? ""}
          ORDER BY sequence, id
        `
      )
      .all(...(where?.values ?? []));

    return rows.map(mapTimelineEventRow);
  }

  listValidationIssues(
    input: ValidationIssueIndexQuery = {}
  ): readonly IndexedArchiveValidationIssue[] {
    const where = buildWhereClause([
      input.archiveId
        ? {
            sql: "archive_id = ?",
            value: input.archiveId
          }
        : undefined,
      input.sessionId
        ? {
            sql: "session_id = ?",
            value: input.sessionId
          }
        : undefined,
      input.severity
        ? {
            sql: "severity = ?",
            value: input.severity
          }
        : undefined,
      input.code
        ? {
            sql: "code = ?",
            value: input.code
          }
        : undefined
    ]);
    const rows = this.database
      .prepare(
        `
          SELECT *
          FROM archive_validation_issues
          ${where?.sql ?? ""}
          ORDER BY id
        `
      )
      .all(...(where?.values ?? []));

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

  private countArchives(where?: WhereClause): number {
    const row = this.database
      .prepare(
        `
          SELECT COUNT(*) AS count
          FROM archives
          ${where?.sql ?? ""}
        `
      )
      .get(...(where?.values ?? []));
    const record = requireRecord(row);

    return requireNumber(record.count);
  }
}

interface WherePredicate {
  readonly sql: string;
  readonly value: string | number;
}

interface WhereClause {
  readonly sql: string;
  readonly values: readonly (string | number)[];
}

function buildWhereClause(
  predicates: readonly (WherePredicate | undefined)[]
): WhereClause | undefined {
  const activePredicates = predicates.filter(
    (predicate): predicate is WherePredicate => predicate !== undefined
  );

  if (activePredicates.length === 0) {
    return undefined;
  }

  return {
    sql: `WHERE ${activePredicates
      .map((predicate) => predicate.sql)
      .join(" AND ")}`,
    values: activePredicates.map((predicate) => predicate.value)
  };
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
