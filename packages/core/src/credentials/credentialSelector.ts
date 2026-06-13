import type {
  CredentialEntitlement,
  CredentialProfile,
  CredentialSelectionResult,
  RecordingIntent
} from "@chronarium/types";
import type { CredentialStore } from "./credentialStore.js";

const USABLE_HEALTH = new Set(["ok", "unknown"]);

interface CredentialCandidate {
  readonly profile: CredentialProfile;
  readonly entitlement: CredentialEntitlement;
  readonly priority: number;
  readonly order: number;
  /** 0 = streamer-scoped entitlement, 1 = site-scoped. */
  readonly specificity: number;
}

/**
 * Resolve which bound credential profile to use for one capture, using the
 * `capability-match-failover` policy. Returns only a redacted `CredentialRef`;
 * it never surfaces a cookie jar (there is none in fixture mode).
 *
 * - `public` intent needs no credential and returns `not-required`.
 * - No binding or no usable, entitled profile returns `missing` (the caller
 *   degrades to public-only or skips; monitoring is never blocked).
 *
 * See `docs/CREDENTIALS_AND_SESSIONS.md`.
 */
export function selectCredentialForCapture(input: {
  readonly store: CredentialStore;
  readonly streamerRef: string;
  readonly siteId: string;
  readonly intent: RecordingIntent;
}): CredentialSelectionResult {
  const { store, streamerRef, siteId, intent } = input;

  if (intent === "public") {
    return { status: "not-required", intent, orderedProfileIds: [] };
  }

  const binding = store.getBinding(streamerRef);
  if (!binding) {
    return missing(intent, `No credential binding for streamer ${streamerRef}.`);
  }

  const candidates: CredentialCandidate[] = [];
  binding.entries.forEach((entry, index) => {
    const profile = store.getProfile(entry.profileId);
    if (!profile || profile.siteId !== siteId) {
      return;
    }
    if (!USABLE_HEALTH.has(profile.health)) {
      return;
    }
    const entitlement = matchEntitlement(profile, intent, streamerRef);
    if (!entitlement) {
      return;
    }
    candidates.push({
      profile,
      entitlement,
      priority: entry.priority,
      order: index,
      specificity: entitlement.scope.startsWith("streamer:") ? 0 : 1
    });
  });

  if (candidates.length === 0) {
    return missing(
      intent,
      `No usable credential profile entitled to ${intent} on streamer ${streamerRef}.`
    );
  }

  const ordered = [...candidates].sort((a, b) => {
    if (binding.policy === "priority") {
      return a.priority - b.priority || a.order - b.order;
    }
    return (
      a.specificity - b.specificity ||
      a.priority - b.priority ||
      a.order - b.order
    );
  });

  const chosen = ordered[0]!;
  return {
    status: "selected",
    intent,
    credentialRef: { profileId: chosen.profile.id },
    entitlementMatched: chosen.entitlement,
    orderedProfileIds: ordered.map((candidate) => candidate.profile.id)
  };
}

function matchEntitlement(
  profile: CredentialProfile,
  intent: RecordingIntent,
  streamerRef: string
): CredentialEntitlement | undefined {
  return profile.entitlements.find(
    (entitlement) =>
      entitlement.intent === intent &&
      (entitlement.scope === "site" ||
        entitlement.scope === `streamer:${streamerRef}`)
  );
}

function missing(
  intent: RecordingIntent,
  reason: string
): CredentialSelectionResult {
  return { status: "missing", intent, orderedProfileIds: [], reason };
}
