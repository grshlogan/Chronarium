import type {
  AdapterId,
  ChronariumId,
  IsoDateTimeString,
  RedactionStatus,
  RelativeArchivePath,
  Sha256Hex,
  SiteId
} from "./primitives.js";

export type MediaTrackKind = "video" | "audio" | "subtitles" | "data";

export interface MediaTrackSourceRef {
  readonly adapterId?: AdapterId;
  readonly siteId?: SiteId;
  readonly sourceIdHash?: string;
  readonly redactionStatus: RedactionStatus;
}

export interface MediaTrack {
  readonly id: ChronariumId;
  readonly sessionId: ChronariumId;
  readonly kind: MediaTrackKind;
  readonly label?: string;
  readonly codec?: string;
  readonly container?: string;
  readonly timeBase?: string;
  readonly source?: MediaTrackSourceRef;
  readonly segmentsPath: RelativeArchivePath;
  readonly createdAt: IsoDateTimeString;
}

export interface MediaSegmentFact {
  readonly trackId: ChronariumId;
  readonly segmentId: ChronariumId;
  readonly relativePath?: RelativeArchivePath;
  readonly byteLength?: number;
  readonly mediaStartMs?: number;
  readonly durationMs?: number;
  readonly sha256?: Sha256Hex;
  readonly sourceSequence?: number;
  readonly redactionStatus: RedactionStatus;
}
