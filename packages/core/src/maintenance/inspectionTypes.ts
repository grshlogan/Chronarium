export type MaintenanceDomain =
  | "archive"
  | "index"
  | "runtime"
  | "storage"
  | "adapter"
  | "media";

export type MaintenanceSeverity = "info" | "warning" | "error" | "critical";

export type MaintenanceStatus =
  | "open"
  | "acknowledged"
  | "resolved"
  | "suppressed";

export type MaintenanceEvidenceSource =
  | "archive-validator"
  | "timeline"
  | "indexer"
  | "runtime"
  | "filesystem";

export type MaintenanceActionSafetyLevel =
  | "report-only"
  | "safe-rebuild"
  | "requires-user-confirmation"
  | "not-allowed";

export interface MaintenanceEvidence {
  readonly source: MaintenanceEvidenceSource;
  readonly message: string;
  readonly code?: string;
  readonly path?: string;
  readonly eventId?: string;
  readonly sequence?: number;
  readonly eventType?: string;
  readonly evidenceLevel?: string;
  readonly details?: Record<string, unknown>;
}

export interface MaintenanceActionSuggestion {
  readonly id: string;
  readonly label: string;
  readonly safetyLevel: MaintenanceActionSafetyLevel;
  readonly summary: string;
}

export interface MaintenanceFinding {
  readonly id: string;
  readonly domain: MaintenanceDomain;
  readonly severity: MaintenanceSeverity;
  readonly status: MaintenanceStatus;
  readonly title: string;
  readonly summary: string;
  readonly evidence: readonly MaintenanceEvidence[];
  readonly suggestedActions: readonly MaintenanceActionSuggestion[];
  readonly firstSeenAt: string;
  readonly lastSeenAt: string;
}

export type MaintenanceReportStatus = "healthy" | "warning" | "error";

export interface MaintenanceReport {
  readonly schemaVersion: 1;
  readonly inspectedAt: string;
  readonly archiveRootPath: string;
  readonly status: MaintenanceReportStatus;
  readonly summary: {
    readonly findingCount: number;
    readonly errorCount: number;
    readonly warningCount: number;
    readonly infoCount: number;
  };
  readonly findings: readonly MaintenanceFinding[];
}
