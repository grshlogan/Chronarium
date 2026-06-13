import type { AdapterManifest } from "@chronarium/types";
import {
  STRIPCHAT_ADAPTER_ID,
  STRIPCHAT_FIXTURE_CAPABILITIES
} from "./fixtureAdapter.js";
import { STRIPCHAT_SITE_ID } from "./combinedFixture.js";

export const STRIPCHAT_ADAPTER_MANIFEST = {
  schemaVersion: 1,
  adapterId: STRIPCHAT_ADAPTER_ID,
  siteId: STRIPCHAT_SITE_ID,
  displayName: "Stripchat",
  runtimeModes: ["fixture"],
  capabilities: STRIPCHAT_FIXTURE_CAPABILITIES,
  fixtureReadiness: {
    status: "fixture-ready",
    fixtureNames: ["combined-av.synthetic"]
  },
  security: {
    networkAccess: "none",
    requiresCredentials: false,
    emitsSensitiveSourceFields: false
  }
} as const satisfies AdapterManifest;
