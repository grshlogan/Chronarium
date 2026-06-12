import type {
  ArchiveRecoveryReport,
  ArchiveSnapshot,
  ArchiveValidationReport
} from "@chronarium/archive";
import type { OfflineFixtureCaptureInput } from "./offlineFixtureCapturePipeline.js";
import { inspectArchiveRecovery } from "@chronarium/archive";
import type {
  ArchiveIndexQuery,
  ArchiveIndexSummary,
  IndexedArchive,
  IndexedArchiveValidationIssue,
  IndexedTimelineEvent,
  TimelineEventIndexQuery,
  ValidationIssueIndexQuery
} from "@chronarium/indexer";
import {
  createArchiveMaintenanceInspector,
  type ArchiveMaintenanceInspector
} from "./maintenance/index.js";
import type { MaintenanceReport } from "./maintenance/inspectionTypes.js";
import type {
  CoreHealthSnapshot,
  CoreRuntime
} from "./runtime.js";
import {
  runOfflineFixtureCapture,
  type OfflineFixtureCaptureResult
} from "./offlineFixtureCapturePipeline.js";

export interface CoreGuiService {
  getHealth(): Promise<CoreHealthSnapshot>;
  validateArchive(archiveRootPath: string): Promise<ArchiveValidationReport>;
  readArchive(archiveRootPath: string): Promise<ArchiveSnapshot>;
  inspectArchiveRecovery(
    archiveRootPath: string
  ): Promise<ArchiveRecoveryReport>;
  inspectArchiveMaintenance(
    archiveRootPath: string
  ): Promise<MaintenanceReport>;
  runOfflineFixtureCapture(
    input: OfflineFixtureCaptureInput
  ): Promise<OfflineFixtureCaptureResult>;
  reindexArchive(archiveRootPath: string): Promise<ArchiveIndexSummary>;
  listArchives(input?: ArchiveIndexQuery): readonly IndexedArchive[];
  listTimelineEvents(
    input?: TimelineEventIndexQuery
  ): readonly IndexedTimelineEvent[];
  listValidationIssues(
    input?: ValidationIssueIndexQuery
  ): readonly IndexedArchiveValidationIssue[];
}

export interface CoreGuiServiceOptions {
  readonly runtime: CoreRuntime;
}

export function createCoreGuiService(
  options: CoreGuiServiceOptions
): CoreGuiService {
  return new DefaultCoreGuiService(options.runtime);
}

class DefaultCoreGuiService implements CoreGuiService {
  private maintenanceInspector: ArchiveMaintenanceInspector | undefined;

  constructor(private readonly runtime: CoreRuntime) {}

  getHealth(): Promise<CoreHealthSnapshot> {
    return this.runtime.getHealth();
  }

  async validateArchive(
    archiveRootPath: string
  ): Promise<ArchiveValidationReport> {
    return this.runtime.getArchiveIndexService().validateArchive(archiveRootPath);
  }

  async readArchive(archiveRootPath: string): Promise<ArchiveSnapshot> {
    return this.runtime.getArchiveIndexService().readArchive(archiveRootPath);
  }

  inspectArchiveRecovery(
    archiveRootPath: string
  ): Promise<ArchiveRecoveryReport> {
    return inspectArchiveRecovery({
      rootPath: archiveRootPath
    });
  }

  inspectArchiveMaintenance(
    archiveRootPath: string
  ): Promise<MaintenanceReport> {
    return this.getMaintenanceInspector().inspectArchive(archiveRootPath);
  }

  runOfflineFixtureCapture(
    input: OfflineFixtureCaptureInput
  ): Promise<OfflineFixtureCaptureResult> {
    return runOfflineFixtureCapture(input, {
      archiveIndexService: this.runtime.getArchiveIndexService()
    });
  }

  async reindexArchive(archiveRootPath: string): Promise<ArchiveIndexSummary> {
    return this.runtime.getArchiveIndexService().reindexArchive(archiveRootPath);
  }

  listArchives(input?: ArchiveIndexQuery): readonly IndexedArchive[] {
    return this.runtime.getArchiveIndexService().listArchives(input);
  }

  listTimelineEvents(
    input?: TimelineEventIndexQuery
  ): readonly IndexedTimelineEvent[] {
    return this.runtime.getArchiveIndexService().listTimelineEvents(input);
  }

  listValidationIssues(
    input?: ValidationIssueIndexQuery
  ): readonly IndexedArchiveValidationIssue[] {
    return this.runtime.getArchiveIndexService().listValidationIssues(input);
  }

  private getMaintenanceInspector(): ArchiveMaintenanceInspector {
    const service = this.runtime.getArchiveIndexService();
    if (!this.maintenanceInspector) {
      this.maintenanceInspector = createArchiveMaintenanceInspector({
        service
      });
    }

    return this.maintenanceInspector;
  }
}
