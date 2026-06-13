import type { AdapterManifest } from "@chronarium/types";
import {
  CHATURBATE_ADAPTER_ID,
  CHATURBATE_FIXTURE_CAPABILITIES
} from "./fixtureAdapter.js";
import { CHATURBATE_SITE_ID } from "./splitTrackFixture.js";

export const CHATURBATE_ADAPTER_MANIFEST = {
  schemaVersion: 1,
  adapterId: CHATURBATE_ADAPTER_ID,
  siteId: CHATURBATE_SITE_ID,
  displayName: "Chaturbate",
  runtimeModes: ["fixture"],
  capabilities: CHATURBATE_FIXTURE_CAPABILITIES,
  fixtureReadiness: {
    status: "fixture-ready",
    fixtureNames: [
      "live-parser.synthetic",
      "split-audio-video.synthetic",
      "missing-audio.synthetic",
      "diagnostic-anomalies.synthetic"
    ]
  },
  security: {
    networkAccess: "none",
    requiresCredentials: false,
    emitsSensitiveSourceFields: false
  }
} as const satisfies AdapterManifest;
