import type {
  JsonObject,
  MediaTrack,
  MediaTrackKind,
  RedactionStatus,
  TimelineEventEnvelope
} from "@chronarium/types";
import {
  assertNoSensitiveFixtureStrings,
  assertSyntheticFixtureReference,
  expectArray,
  expectNonNegativeInteger,
  expectNumber,
  expectOptionalArray,
  expectOptionalNumber,
  expectRecord,
  expectString,
  optionalStringProperty
} from "@chronarium/adapter-kit";
import { CHATURBATE_ADAPTER_ID } from "./fixtureAdapter.js";
import {
  CHATURBATE_SITE_ID,
  CHATURBATE_SYNTHETIC_REFERENCE_PREFIX
} from "./splitTrackFixture.js";

export interface ChaturbateLiveParserFixture {
  readonly schemaVersion: 1;
  readonly name: string;
  readonly sessionId: string;
  readonly capturedAt: string;
  readonly monotonicStartMs: number;
  readonly masterPlaylist: ChaturbatePlaylistText;
  readonly mediaPlaylists: readonly ChaturbateMediaPlaylistText[];
  readonly roomState?: ChaturbateRoomStateFixture;
  readonly chatMessages: readonly ChaturbateChatMessageFixture[];
  readonly networkEvents: readonly ChaturbateNetworkEventFixture[];
  readonly gaps: readonly ChaturbateGapFixture[];
  readonly diagnosticNotes: readonly ChaturbateDiagnosticNoteFixture[];
}

export interface ChaturbatePlaylistText {
  readonly reference: string;
  readonly text: string;
}

export interface ChaturbateMediaPlaylistText extends ChaturbatePlaylistText {
  readonly trackId: string;
  readonly kind: Extract<MediaTrackKind, "video" | "audio">;
  readonly label?: string;
  readonly codec?: string;
  readonly sourceIdHash: string;
}

export interface ChaturbateRoomStateFixture {
  readonly state: string;
  readonly showMode?: string;
  readonly viewerCount?: number;
  readonly topic?: string;
}

export interface ChaturbateChatMessageFixture {
  readonly messageId: string;
  readonly authorRef: string;
  readonly body: string;
  readonly role?: string;
  readonly monotonicMs: number;
}

export type ChaturbateNetworkEventFixture =
  | {
      readonly kind: "disconnected";
      readonly eventId: string;
      readonly reason: string;
      readonly affectedTrackIds: readonly string[];
      readonly monotonicMs: number;
    }
  | {
      readonly kind: "reconnected";
      readonly disconnectedEventId: string;
      readonly outageDurationMs: number;
      readonly affectedTrackIds: readonly string[];
      readonly monotonicMs: number;
    };

export interface ChaturbateGapFixture {
  readonly trackId: string;
  readonly previousSegmentId: string;
  readonly nextSegmentId: string;
  readonly gapStartMs: number;
  readonly durationMs: number;
  readonly level: "warning" | "error";
  readonly message: string;
  readonly monotonicMs: number;
}

export interface ChaturbateDiagnosticNoteFixture {
  readonly level: "warning" | "error" | "info";
  readonly code?: string;
  readonly message: string;
  readonly monotonicMs: number;
}

interface ParsedMediaSegment {
  readonly id: string;
  readonly sourceSequence: number;
  readonly mediaStartMs: number;
  readonly durationMs: number;
}

export function parseChaturbateLiveParserFixture(
  value: unknown
): ChaturbateLiveParserFixture {
  const fixture = expectRecord(value, "fixture");
  const schemaVersion = expectNumber(fixture.schemaVersion, "schemaVersion");
  if (schemaVersion !== 1) {
    throw new Error(`schemaVersion must be 1, received ${schemaVersion}.`);
  }

  const parsedFixture = {
    schemaVersion: 1,
    name: expectString(fixture.name, "name"),
    sessionId: expectString(fixture.sessionId, "sessionId"),
    capturedAt: expectString(fixture.capturedAt, "capturedAt"),
    monotonicStartMs: expectOptionalNumber(
      fixture.monotonicStartMs,
      "monotonicStartMs",
      0
    ),
    masterPlaylist: parsePlaylistText(fixture.masterPlaylist, "masterPlaylist"),
    mediaPlaylists: expectArray(fixture.mediaPlaylists, "mediaPlaylists").map(
      (playlist, index) =>
        parseMediaPlaylistText(playlist, `mediaPlaylists[${index}]`)
    ),
    ...(fixture.roomState === undefined
      ? {}
      : { roomState: parseRoomState(fixture.roomState, "roomState") }),
    chatMessages: expectOptionalArray(fixture.chatMessages, "chatMessages").map(
      (message, index) => parseChatMessage(message, `chatMessages[${index}]`)
    ),
    networkEvents: expectOptionalArray(
      fixture.networkEvents,
      "networkEvents"
    ).map((event, index) => parseNetworkEvent(event, `networkEvents[${index}]`)),
    gaps: expectOptionalArray(fixture.gaps, "gaps").map((gap, index) =>
      parseGap(gap, `gaps[${index}]`)
    ),
    diagnosticNotes: expectOptionalArray(
      fixture.diagnosticNotes,
      "diagnosticNotes"
    ).map((note, index) =>
      parseDiagnosticNote(note, `diagnosticNotes[${index}]`)
    )
  } as const;

  if (parsedFixture.mediaPlaylists.length === 0) {
    throw new Error("mediaPlaylists must contain at least one playlist.");
  }

  assertMasterReferencesKnownTracks(parsedFixture);
  assertNoSensitiveFixtureStrings(parsedFixture, "fixture");
  return parsedFixture;
}

export function createChaturbateLiveParserTimelineEvents(
  fixture: ChaturbateLiveParserFixture
): readonly TimelineEventEnvelope[] {
  const events: TimelineEventEnvelope[] = [];
  let sequence = 1;

  const trackIds = fixture.mediaPlaylists.map((playlist) => playlist.trackId);
  events.push(
    createFixtureTimelineEvent({
      fixture,
      sequence,
      type: "media.track.topology_observed",
      monotonicMs: fixture.monotonicStartMs,
      payload: {
        fixtureName: fixture.name,
        protocol: "ll-hls-cmaf",
        playlistReference: fixture.masterPlaylist.reference,
        trackIds,
        syntheticOnly: true
      }
    })
  );
  sequence += 1;

  for (const playlist of fixture.mediaPlaylists) {
    const segments = parseMediaPlaylistSegments(playlist);
    events.push(
      createFixtureTimelineEvent({
        fixture,
        sequence,
        type: "media.track.discovered",
        monotonicMs: fixture.monotonicStartMs,
        sourceIdHash: playlist.sourceIdHash,
        payload: {
          trackId: playlist.trackId,
          kind: playlist.kind,
          playlistReference: playlist.reference,
          sourceIdHash: playlist.sourceIdHash,
          syntheticOnly: true,
          ...(playlist.label ? { label: playlist.label } : {}),
          ...(playlist.codec ? { codec: playlist.codec } : {}),
          container: "fmp4",
          timeBase: "1/1000"
        }
      })
    );
    sequence += 1;

    for (const segment of segments) {
      events.push(
        createFixtureTimelineEvent({
          fixture,
          sequence,
          type: "media.segment.observed",
          monotonicMs: fixture.monotonicStartMs + segment.mediaStartMs,
          sourceIdHash: playlist.sourceIdHash,
          payload: {
            trackId: playlist.trackId,
            segmentId: segment.id,
            sourceSequence: segment.sourceSequence,
            mediaStartMs: segment.mediaStartMs,
            durationMs: segment.durationMs,
            playlistReference: playlist.reference,
            syntheticOnly: true
          }
        })
      );
      sequence += 1;
    }
  }

  if (fixture.roomState !== undefined) {
    events.push(
      createFixtureTimelineEvent({
        fixture,
        sequence,
        type: "room.state.changed",
        monotonicMs: fixture.monotonicStartMs,
        payload: {
          state: fixture.roomState.state,
          syntheticOnly: true,
          ...(fixture.roomState.showMode
            ? { showMode: fixture.roomState.showMode }
            : {}),
          ...(fixture.roomState.viewerCount === undefined
            ? {}
            : { viewerCount: fixture.roomState.viewerCount }),
          ...(fixture.roomState.topic ? { topic: fixture.roomState.topic } : {})
        }
      })
    );
    sequence += 1;
  }

  for (const message of fixture.chatMessages) {
    events.push(
      createFixtureTimelineEvent({
        fixture,
        sequence,
        type: "chat.message.observed",
        monotonicMs: fixture.monotonicStartMs + message.monotonicMs,
        payload: {
          messageId: message.messageId,
          authorRef: message.authorRef,
          body: message.body,
          redactionStatus: "synthetic",
          syntheticOnly: true,
          ...(message.role ? { role: message.role } : {})
        }
      })
    );
    sequence += 1;
  }

  const disconnectedEventIds = new Map<string, string>();
  for (const networkEvent of fixture.networkEvents) {
    const timelineEventId = `${fixture.name}:event:${sequence}`;
    if (networkEvent.kind === "disconnected") {
      disconnectedEventIds.set(networkEvent.eventId, timelineEventId);
      events.push(
        createFixtureTimelineEvent({
          fixture,
          sequence,
          type: "network.disconnected",
          monotonicMs: fixture.monotonicStartMs + networkEvent.monotonicMs,
          eventId: timelineEventId,
          payload: {
            reason: networkEvent.reason,
            affectedTrackIds: [...networkEvent.affectedTrackIds],
            syntheticOnly: true
          }
        })
      );
    } else {
      const disconnectedEventId = disconnectedEventIds.get(
        networkEvent.disconnectedEventId
      );
      if (disconnectedEventId === undefined) {
        throw new Error(
          `network.reconnected references unknown disconnected event: ${networkEvent.disconnectedEventId}`
        );
      }
      events.push(
        createFixtureTimelineEvent({
          fixture,
          sequence,
          type: "network.reconnected",
          monotonicMs: fixture.monotonicStartMs + networkEvent.monotonicMs,
          eventId: timelineEventId,
          payload: {
            disconnectedEventId,
            outageDurationMs: networkEvent.outageDurationMs,
            affectedTrackIds: [...networkEvent.affectedTrackIds],
            syntheticOnly: true
          }
        })
      );
    }
    sequence += 1;
  }

  for (const gap of fixture.gaps) {
    events.push(
      createFixtureTimelineEvent({
        fixture,
        sequence,
        type: "media.gap.detected",
        monotonicMs: fixture.monotonicStartMs + gap.monotonicMs,
        payload: {
          trackId: gap.trackId,
          previousSegmentId: gap.previousSegmentId,
          nextSegmentId: gap.nextSegmentId,
          gapStartMs: gap.gapStartMs,
          gapEndMs: gap.gapStartMs + gap.durationMs,
          durationMs: gap.durationMs,
          level: gap.level,
          code: "media_gap.detected",
          evidenceLevel: "synthetic-contract",
          message: gap.message,
          affectedTrackIds: [gap.trackId],
          syntheticOnly: true
        }
      })
    );
    sequence += 1;
  }

  for (const note of fixture.diagnosticNotes) {
    events.push(
      createFixtureTimelineEvent({
        fixture,
        sequence,
        type: "diagnostic.note",
        monotonicMs: fixture.monotonicStartMs + note.monotonicMs,
        payload: {
          level: note.level,
          message: note.message,
          syntheticOnly: true,
          ...(note.code ? { code: note.code } : {})
        }
      })
    );
    sequence += 1;
  }

  return events;
}

export function createChaturbateLiveParserMediaTracks(
  fixture: ChaturbateLiveParserFixture
): readonly MediaTrack[] {
  return fixture.mediaPlaylists.map((playlist) => ({
    id: playlist.trackId,
    sessionId: fixture.sessionId,
    kind: playlist.kind,
    ...(playlist.label ? { label: playlist.label } : {}),
    ...(playlist.codec ? { codec: playlist.codec } : {}),
    container: "fmp4",
    timeBase: "1/1000",
    source: createSyntheticSource(playlist.sourceIdHash),
    segmentsPath: `tracks/${playlist.trackId}/segments`,
    createdAt: fixture.capturedAt
  }));
}

function parsePlaylistText(value: unknown, path: string): ChaturbatePlaylistText {
  const playlist = expectRecord(value, path);
  const reference = expectString(playlist.reference, `${path}.reference`);
  assertSyntheticFixtureReference(
    reference,
    `${path}.reference`,
    CHATURBATE_SYNTHETIC_REFERENCE_PREFIX
  );

  const text = expectString(playlist.text, `${path}.text`);
  assertNoSensitiveFixtureStrings(text, `${path}.text`);
  assertPlaylistTextUsesSyntheticReferences(text, `${path}.text`);
  return {
    reference,
    text
  };
}

function parseMediaPlaylistText(
  value: unknown,
  path: string
): ChaturbateMediaPlaylistText {
  const playlist = expectRecord(value, path);
  const parsed = parsePlaylistText(value, path);
  const kind = expectString(playlist.kind, `${path}.kind`);
  if (kind !== "video" && kind !== "audio") {
    throw new Error(`${path}.kind must be video or audio, received ${kind}.`);
  }

  return {
    ...parsed,
    trackId: expectString(playlist.trackId, `${path}.trackId`),
    kind,
    ...optionalStringProperty("label", playlist.label, `${path}.label`),
    ...optionalStringProperty("codec", playlist.codec, `${path}.codec`),
    sourceIdHash: expectString(playlist.sourceIdHash, `${path}.sourceIdHash`)
  };
}

function parseRoomState(
  value: unknown,
  path: string
): ChaturbateRoomStateFixture {
  const roomState = expectRecord(value, path);
  const parsed = {
    state: expectString(roomState.state, `${path}.state`),
    ...optionalStringProperty("showMode", roomState.showMode, `${path}.showMode`),
    ...(roomState.viewerCount === undefined
      ? {}
      : {
          viewerCount: expectNonNegativeInteger(
            roomState.viewerCount,
            `${path}.viewerCount`
          )
        }),
    ...optionalStringProperty("topic", roomState.topic, `${path}.topic`)
  };

  assertNoSensitiveFixtureStrings(parsed, path);
  return parsed;
}

function parseChatMessage(
  value: unknown,
  path: string
): ChaturbateChatMessageFixture {
  const message = expectRecord(value, path);
  const parsed = {
    messageId: expectString(message.messageId, `${path}.messageId`),
    authorRef: expectString(message.authorRef, `${path}.authorRef`),
    body: expectString(message.body, `${path}.body`),
    ...optionalStringProperty("role", message.role, `${path}.role`),
    monotonicMs: expectNonNegativeInteger(message.monotonicMs, `${path}.monotonicMs`)
  };

  assertNoSensitiveFixtureStrings(parsed, path);
  return parsed;
}

function parseNetworkEvent(
  value: unknown,
  path: string
): ChaturbateNetworkEventFixture {
  const event = expectRecord(value, path);
  const kind = expectString(event.kind, `${path}.kind`);
  const affectedTrackIds = expectOptionalArray(
    event.affectedTrackIds,
    `${path}.affectedTrackIds`
  ).map((trackId, index) =>
    expectString(trackId, `${path}.affectedTrackIds[${index}]`)
  );

  if (kind === "disconnected") {
    const parsed = {
      kind,
      eventId: expectString(event.eventId, `${path}.eventId`),
      reason: expectString(event.reason, `${path}.reason`),
      affectedTrackIds,
      monotonicMs: expectNonNegativeInteger(event.monotonicMs, `${path}.monotonicMs`)
    } as const;
    assertNoSensitiveFixtureStrings(parsed, path);
    return parsed;
  }

  if (kind === "reconnected") {
    const parsed = {
      kind,
      disconnectedEventId: expectString(
        event.disconnectedEventId,
        `${path}.disconnectedEventId`
      ),
      outageDurationMs: expectNonNegativeInteger(
        event.outageDurationMs,
        `${path}.outageDurationMs`
      ),
      affectedTrackIds,
      monotonicMs: expectNonNegativeInteger(event.monotonicMs, `${path}.monotonicMs`)
    } as const;
    assertNoSensitiveFixtureStrings(parsed, path);
    return parsed;
  }

  throw new Error(`${path}.kind must be disconnected or reconnected.`);
}

function parseGap(value: unknown, path: string): ChaturbateGapFixture {
  const gap = expectRecord(value, path);
  const level = expectString(gap.level, `${path}.level`);
  if (level !== "warning" && level !== "error") {
    throw new Error(`${path}.level must be warning or error.`);
  }

  const parsed = {
    trackId: expectString(gap.trackId, `${path}.trackId`),
    previousSegmentId: expectString(
      gap.previousSegmentId,
      `${path}.previousSegmentId`
    ),
    nextSegmentId: expectString(gap.nextSegmentId, `${path}.nextSegmentId`),
    gapStartMs: expectNonNegativeInteger(gap.gapStartMs, `${path}.gapStartMs`),
    durationMs: expectNonNegativeInteger(gap.durationMs, `${path}.durationMs`),
    level,
    message: expectString(gap.message, `${path}.message`),
    monotonicMs: expectNonNegativeInteger(gap.monotonicMs, `${path}.monotonicMs`)
  } as const;
  assertNoSensitiveFixtureStrings(parsed, path);
  return parsed;
}

function parseDiagnosticNote(
  value: unknown,
  path: string
): ChaturbateDiagnosticNoteFixture {
  const note = expectRecord(value, path);
  const level = expectString(note.level, `${path}.level`);
  if (level !== "warning" && level !== "error" && level !== "info") {
    throw new Error(`${path}.level must be warning, error, or info.`);
  }

  const parsed = {
    level,
    ...optionalStringProperty("code", note.code, `${path}.code`),
    message: expectString(note.message, `${path}.message`),
    monotonicMs: expectNonNegativeInteger(note.monotonicMs, `${path}.monotonicMs`)
  } as const;
  assertNoSensitiveFixtureStrings(parsed, path);
  return parsed;
}

function assertMasterReferencesKnownTracks(
  fixture: ChaturbateLiveParserFixture
): void {
  const knownReferences = new Set(
    fixture.mediaPlaylists.map((playlist) => playlist.reference)
  );
  const referencedPlaylists = extractFixtureReferences(fixture.masterPlaylist.text);

  for (const reference of referencedPlaylists) {
    if (!knownReferences.has(reference)) {
      throw new Error(
        `masterPlaylist references unknown synthetic media playlist: ${reference}`
      );
    }
  }
}

function parseMediaPlaylistSegments(
  playlist: ChaturbateMediaPlaylistText
): readonly ParsedMediaSegment[] {
  const lines = playlist.text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const mediaSequence = parseMediaSequence(lines);
  const segments: ParsedMediaSegment[] = [];
  let mediaStartMs = 0;
  let pendingDurationMs: number | undefined;

  for (const line of lines) {
    if (line.startsWith("#EXTINF:")) {
      pendingDurationMs = parseExtinfDurationMs(line);
      continue;
    }

    if (line.startsWith("#")) {
      continue;
    }

    assertSyntheticFixtureReference(
      line,
      `${playlist.trackId}.segmentReference`,
      CHATURBATE_SYNTHETIC_REFERENCE_PREFIX
    );

    if (pendingDurationMs === undefined) {
      throw new Error(`${playlist.trackId} segment is missing #EXTINF.`);
    }

    const sourceSequence = mediaSequence + segments.length;
    segments.push({
      id: `${playlist.trackId}-segment-${sourceSequence.toString().padStart(4, "0")}`,
      sourceSequence,
      mediaStartMs,
      durationMs: pendingDurationMs
    });
    mediaStartMs += pendingDurationMs;
    pendingDurationMs = undefined;
  }

  if (segments.length === 0) {
    throw new Error(`${playlist.trackId} media playlist has no segments.`);
  }

  return segments;
}

function parseMediaSequence(lines: readonly string[]): number {
  const mediaSequenceLine = lines.find((line) =>
    line.startsWith("#EXT-X-MEDIA-SEQUENCE:")
  );
  if (mediaSequenceLine === undefined) {
    return 0;
  }

  return expectNonNegativeInteger(
    Number(mediaSequenceLine.slice("#EXT-X-MEDIA-SEQUENCE:".length)),
    "mediaSequence"
  );
}

function parseExtinfDurationMs(line: string): number {
  const value = Number(line.slice("#EXTINF:".length).replace(/,$/, ""));
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid #EXTINF duration: ${line}`);
  }
  return Math.round(value * 1000);
}

function assertPlaylistTextUsesSyntheticReferences(text: string, path: string): void {
  for (const [index, rawLine] of text.split(/\r?\n/).entries()) {
    const line = rawLine.trim();
    if (line.length === 0) {
      continue;
    }

    const linePath = `${path}.line${index + 1}`;
    if (!line.startsWith("#")) {
      assertSyntheticFixtureReference(
        line,
        linePath,
        CHATURBATE_SYNTHETIC_REFERENCE_PREFIX
      );
      continue;
    }

    for (const reference of extractQuotedUriValues(line)) {
      assertSyntheticFixtureReference(
        reference,
        `${linePath}.URI`,
        CHATURBATE_SYNTHETIC_REFERENCE_PREFIX
      );
    }
  }
}

function extractFixtureReferences(text: string): readonly string[] {
  const references = new Set<string>();
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith(CHATURBATE_SYNTHETIC_REFERENCE_PREFIX)) {
      references.add(line);
    }

    for (const quotedValue of extractQuotedUriValues(line)) {
      if (quotedValue.startsWith(CHATURBATE_SYNTHETIC_REFERENCE_PREFIX)) {
        references.add(quotedValue);
      }
    }
  }

  return [...references];
}

function extractQuotedUriValues(line: string): readonly string[] {
  return [...line.matchAll(/\bURI="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((value): value is string => value !== undefined);
}

function createFixtureTimelineEvent(input: {
  readonly fixture: ChaturbateLiveParserFixture;
  readonly sequence: number;
  readonly type: TimelineEventEnvelope["type"];
  readonly monotonicMs: number;
  readonly payload: JsonObject;
  readonly sourceIdHash?: string;
  readonly eventId?: string;
}): TimelineEventEnvelope {
  return {
    schemaVersion: 1,
    eventId: input.eventId ?? `${input.fixture.name}:event:${input.sequence}`,
    sessionId: input.fixture.sessionId,
    type: input.type,
    sequence: input.sequence,
    capturedAt: input.fixture.capturedAt,
    monotonicMs: input.monotonicMs,
    source: createSyntheticSource(input.sourceIdHash),
    sensitivity: "synthetic",
    payload: input.payload
  };
}

function createSyntheticSource(sourceIdHash?: string): {
  readonly adapterId: string;
  readonly siteId: string;
  readonly sourceIdHash?: string;
  readonly redactionStatus: RedactionStatus;
} {
  return {
    adapterId: CHATURBATE_ADAPTER_ID,
    siteId: CHATURBATE_SITE_ID,
    ...(sourceIdHash ? { sourceIdHash } : {}),
    redactionStatus: "synthetic"
  };
}
