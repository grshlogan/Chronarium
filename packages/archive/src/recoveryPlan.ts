import type {
  ArchiveRecoveryFinding,
  ArchiveRecoveryFindingCode,
  ArchiveRecoveryReport,
  ArchiveRecoverySuggestedAction
} from "./recovery.js";

/**
 * A report-only recovery plan derived from an `ArchiveRecoveryReport`. It groups
 * recovery findings into ordered proposed actions, each tagged with a safety
 * level. It executes nothing: every step is `executable: false`. This is the
 * contract a future, user-approved recovery executor would consume. See
 * `docs/plan/plan_archive_recovery_plan.md`.
 */
export type RecoveryPlanSafetyLevel =
  | "report-only"
  | "safe-rebuild"
  | "destructive-confirm";

export interface RecoveryPlanTarget {
  readonly path?: string;
  readonly trackId?: string;
}

export interface RecoveryPlanStep {
  readonly action: ArchiveRecoverySuggestedAction;
  readonly safetyLevel: RecoveryPlanSafetyLevel;
  readonly summary: string;
  readonly findingCodes: readonly ArchiveRecoveryFindingCode[];
  readonly targets: readonly RecoveryPlanTarget[];
  /** Always false: this slice proposes actions but never executes them. */
  readonly executable: false;
}

export type ArchiveRecoveryPlanStatus = "no-action" | "actions-proposed";

export interface ArchiveRecoveryPlan {
  readonly schemaVersion: 1;
  readonly archiveRootPath: string;
  readonly status: ArchiveRecoveryPlanStatus;
  readonly steps: readonly RecoveryPlanStep[];
}

/** Fixed recovery sequence: fix the manifest first, filesystem cleanups last. */
const ACTION_ORDER: readonly ArchiveRecoverySuggestedAction[] = [
  "restore-or-recreate-manifest",
  "recompute-manifest-counts-with-confirmation",
  "quarantine-trailing-line-with-confirmation",
  "remove-temp-file-with-confirmation",
  "adopt-or-remove-track-with-confirmation",
  "inspect-manually"
];

const ACTION_SAFETY: Record<
  ArchiveRecoverySuggestedAction,
  RecoveryPlanSafetyLevel
> = {
  "inspect-manually": "report-only",
  "recompute-manifest-counts-with-confirmation": "safe-rebuild",
  "restore-or-recreate-manifest": "destructive-confirm",
  "quarantine-trailing-line-with-confirmation": "destructive-confirm",
  "remove-temp-file-with-confirmation": "destructive-confirm",
  "adopt-or-remove-track-with-confirmation": "destructive-confirm"
};

const ACTION_SUMMARY: Record<ArchiveRecoverySuggestedAction, string> = {
  "inspect-manually": "Inspect the affected files manually before any change.",
  "recompute-manifest-counts-with-confirmation":
    "Recompute manifest timeline counts from the timeline (confirmation required).",
  "restore-or-recreate-manifest":
    "Restore or recreate the archive manifest (confirmation required).",
  "quarantine-trailing-line-with-confirmation":
    "Quarantine the invalid trailing timeline line (confirmation required).",
  "remove-temp-file-with-confirmation":
    "Remove orphan temporary files (confirmation required).",
  "adopt-or-remove-track-with-confirmation":
    "Adopt or remove the undeclared track directory (confirmation required)."
};

export function buildArchiveRecoveryPlan(
  report: ArchiveRecoveryReport
): ArchiveRecoveryPlan {
  const byAction = new Map<
    ArchiveRecoverySuggestedAction,
    ArchiveRecoveryFinding[]
  >();
  for (const finding of report.findings) {
    const group = byAction.get(finding.suggestedAction);
    if (group) {
      group.push(finding);
    } else {
      byAction.set(finding.suggestedAction, [finding]);
    }
  }

  const steps: RecoveryPlanStep[] = [];
  for (const action of ACTION_ORDER) {
    const findings = byAction.get(action);
    if (!findings || findings.length === 0) {
      continue;
    }
    steps.push({
      action,
      safetyLevel: ACTION_SAFETY[action],
      summary: ACTION_SUMMARY[action],
      findingCodes: [...new Set(findings.map((finding) => finding.code))],
      targets: findings.map((finding) => toTarget(finding)),
      executable: false
    });
  }

  return {
    schemaVersion: 1,
    archiveRootPath: report.archiveRootPath,
    status: steps.length > 0 ? "actions-proposed" : "no-action",
    steps
  };
}

function toTarget(finding: ArchiveRecoveryFinding): RecoveryPlanTarget {
  return {
    ...(finding.path ? { path: finding.path } : {}),
    ...(finding.trackId ? { trackId: finding.trackId } : {})
  };
}
