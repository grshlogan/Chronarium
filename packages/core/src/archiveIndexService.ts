import {
  type ArchiveSnapshot,
  type ArchiveValidationReport,
  readFileArchive,
  validateFileArchive
} from "@chronarium/archive";
import {
  type ArchiveIndexQuery,
  type ArchiveIndexSummary,
  type ChronariumIndex,
  type IndexedArchive,
  type IndexedArchiveValidationIssue,
  type IndexedTimelineEvent,
  type TimelineEventIndexQuery,
  type ValidationIssueIndexQuery
} from "@chronarium/indexer";

export interface CoreArchiveIndexService {
  validateArchive(archiveRootPath: string): Promise<ArchiveValidationReport>;
  readArchive(archiveRootPath: string): Promise<ArchiveSnapshot>;
  reindexArchive(archiveRootPath: string): Promise<ArchiveIndexSummary>;
  listArchives(input?: ArchiveIndexQuery): readonly IndexedArchive[];
  listTimelineEvents(
    input?: TimelineEventIndexQuery
  ): readonly IndexedTimelineEvent[];
  listValidationIssues(
    input?: ValidationIssueIndexQuery
  ): readonly IndexedArchiveValidationIssue[];
}

export interface CoreArchiveIndexServiceOptions {
  readonly index: ChronariumIndex;
}

export function createCoreArchiveIndexService(
  options: CoreArchiveIndexServiceOptions
): CoreArchiveIndexService {
  return new DefaultCoreArchiveIndexService(options.index);
}

class DefaultCoreArchiveIndexService implements CoreArchiveIndexService {
  constructor(private readonly index: ChronariumIndex) {}

  async validateArchive(
    archiveRootPath: string
  ): Promise<ArchiveValidationReport> {
    return validateFileArchive({
      rootPath: archiveRootPath
    });
  }

  async readArchive(archiveRootPath: string): Promise<ArchiveSnapshot> {
    return readFileArchive({
      rootPath: archiveRootPath
    });
  }

  async reindexArchive(
    archiveRootPath: string
  ): Promise<ArchiveIndexSummary> {
    return this.index.reindexArchiveFromPath(archiveRootPath);
  }

  listArchives(input?: ArchiveIndexQuery): readonly IndexedArchive[] {
    return this.index.listArchives(input);
  }

  listTimelineEvents(
    input?: TimelineEventIndexQuery
  ): readonly IndexedTimelineEvent[] {
    return this.index.listTimelineEvents(input);
  }

  listValidationIssues(
    input?: ValidationIssueIndexQuery
  ): readonly IndexedArchiveValidationIssue[] {
    return this.index.listValidationIssues(input);
  }
}
