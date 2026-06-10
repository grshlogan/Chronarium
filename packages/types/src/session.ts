import type {
  ChronariumId,
  IsoDateTimeString,
  RedactionStatus,
  SiteId
} from "./primitives.js";

export type LiveSessionStatus =
  | "planned"
  | "capturing"
  | "paused"
  | "ended"
  | "failed"
  | "imported";

export interface LiveSessionSiteRef {
  readonly siteId: SiteId;
  readonly roomIdHash?: string;
  readonly roomDisplayName?: string;
  readonly redactionStatus: RedactionStatus;
}

export interface LiveSession {
  readonly id: ChronariumId;
  readonly schemaVersion: 1;
  readonly site: LiveSessionSiteRef;
  readonly createdAt: IsoDateTimeString;
  readonly startedAt?: IsoDateTimeString;
  readonly endedAt?: IsoDateTimeString;
  readonly status: LiveSessionStatus;
  readonly title?: string;
  readonly tags?: readonly string[];
}
