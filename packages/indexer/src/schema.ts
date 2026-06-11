import type { DatabaseSync } from "node:sqlite";

export const INDEX_SCHEMA_VERSION = 1;

export function initializeIndexSchema(database: DatabaseSync): void {
  database.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS index_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    INSERT OR IGNORE INTO index_metadata (key, value)
    VALUES ('schema_version', '${INDEX_SCHEMA_VERSION}');

    CREATE TABLE IF NOT EXISTS archives (
      archive_id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      archive_root_path TEXT NOT NULL,
      site_id TEXT NOT NULL,
      session_status TEXT NOT NULL,
      session_created_at TEXT NOT NULL,
      archive_created_at TEXT NOT NULL,
      archive_updated_at TEXT NOT NULL,
      timeline_event_count INTEGER NOT NULL,
      timeline_last_sequence INTEGER,
      validation_ok INTEGER NOT NULL,
      indexed_at TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS archives_root_path_idx
      ON archives (archive_root_path);

    CREATE INDEX IF NOT EXISTS archives_session_id_idx
      ON archives (session_id);

    CREATE INDEX IF NOT EXISTS archives_site_id_idx
      ON archives (site_id);

    CREATE TABLE IF NOT EXISTS timeline_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      archive_id TEXT NOT NULL,
      event_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      sequence INTEGER NOT NULL,
      type TEXT NOT NULL,
      captured_at TEXT NOT NULL,
      source_time TEXT,
      sensitivity TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      FOREIGN KEY (archive_id)
        REFERENCES archives (archive_id)
        ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS timeline_events_session_sequence_idx
      ON timeline_events (session_id, sequence);

    CREATE INDEX IF NOT EXISTS timeline_events_type_idx
      ON timeline_events (type);

    CREATE INDEX IF NOT EXISTS timeline_events_event_id_idx
      ON timeline_events (event_id);

    CREATE TABLE IF NOT EXISTS archive_validation_issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      archive_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      severity TEXT NOT NULL,
      code TEXT NOT NULL,
      message TEXT NOT NULL,
      path TEXT,
      line INTEGER,
      event_id TEXT,
      sequence INTEGER,
      FOREIGN KEY (archive_id)
        REFERENCES archives (archive_id)
        ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS archive_validation_issues_archive_idx
      ON archive_validation_issues (archive_id);

    CREATE INDEX IF NOT EXISTS archive_validation_issues_code_idx
      ON archive_validation_issues (code);
  `);
}
