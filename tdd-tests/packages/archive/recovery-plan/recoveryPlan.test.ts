import { buildArchiveRecoveryPlan } from "@chronarium/archive";
import type {
  ArchiveRecoveryFinding,
  ArchiveRecoveryReport
} from "@chronarium/archive";
import { describe, expect, it } from "vitest";

function report(
  findings: readonly ArchiveRecoveryFinding[]
): ArchiveRecoveryReport {
  const errorCount = findings.filter((f) => f.severity === "error").length;
  const warningCount = findings.filter((f) => f.severity === "warning").length;
  const infoCount = findings.filter((f) => f.severity === "info").length;
  return {
    schemaVersion: 1,
    archiveRootPath: "/synthetic/session.chron",
    inspectedAt: "2026-06-14T00:00:00.000Z",
    status: errorCount > 0 ? "blocked" : findings.length > 0 ? "needs-attention" : "healthy",
    summary: { findingCount: findings.length, errorCount, warningCount, infoCount },
    validation: {
      ok: errorCount === 0,
      rootPath: "/synthetic/session.chron",
      mediaTracks: [],
      timelineEvents: [],
      issues: []
    },
    findings
  };
}

describe("buildArchiveRecoveryPlan", () => {
  it("groups orphan temp findings into one destructive-confirm step with no execution", () => {
    const plan = buildArchiveRecoveryPlan(
      report([
        {
          severity: "warning",
          code: "recovery.orphan_temp_file",
          path: "a.tmp",
          message: "orphan a",
          suggestedAction: "remove-temp-file-with-confirmation"
        },
        {
          severity: "warning",
          code: "recovery.orphan_temp_file",
          path: "tracks/video-main/track.json.tmp",
          trackId: "video-main",
          message: "orphan b",
          suggestedAction: "remove-temp-file-with-confirmation"
        }
      ])
    );

    expect(plan.status).toBe("actions-proposed");
    expect(plan.steps).toHaveLength(1);
    const step = plan.steps[0]!;
    expect(step.action).toBe("remove-temp-file-with-confirmation");
    expect(step.safetyLevel).toBe("destructive-confirm");
    expect(step.targets).toHaveLength(2);
    expect(step.executable).toBe(false);
  });

  it("returns no-action for a healthy report", () => {
    const plan = buildArchiveRecoveryPlan(report([]));
    expect(plan.status).toBe("no-action");
    expect(plan.steps).toEqual([]);
  });

  it("orders steps by recovery sequence and maps safety levels", () => {
    const plan = buildArchiveRecoveryPlan(
      report([
        {
          severity: "warning",
          code: "recovery.orphan_temp_file",
          path: "a.tmp",
          message: "orphan",
          suggestedAction: "remove-temp-file-with-confirmation"
        },
        {
          severity: "error",
          code: "recovery.manifest_missing",
          path: "manifest.json",
          message: "manifest missing",
          suggestedAction: "restore-or-recreate-manifest"
        },
        {
          severity: "warning",
          code: "recovery.manifest_count_mismatch",
          path: "manifest.json",
          message: "count mismatch",
          suggestedAction: "recompute-manifest-counts-with-confirmation"
        },
        {
          severity: "info",
          code: "recovery.track_metadata_missing",
          trackId: "audio-main",
          message: "inspect",
          suggestedAction: "inspect-manually"
        }
      ])
    );

    expect(plan.steps.map((step) => step.action)).toEqual([
      "restore-or-recreate-manifest",
      "recompute-manifest-counts-with-confirmation",
      "remove-temp-file-with-confirmation",
      "inspect-manually"
    ]);
    expect(plan.steps.map((step) => step.safetyLevel)).toEqual([
      "destructive-confirm",
      "safe-rebuild",
      "destructive-confirm",
      "report-only"
    ]);
    expect(plan.steps.every((step) => step.executable === false)).toBe(true);
  });
});
