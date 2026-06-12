import { readTimelineEventBatches } from "../../packages/archive/dist/index.js";
import {
  createLargeSyntheticTimelineBuilder,
  createSyntheticArchiveManifest
} from "../../packages/testkit/dist/index.js";
import { mkdir, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";

const eventCount = readIntegerArg("--events", 1_000);
const batchSize = readIntegerArg("--batch-size", 1_000);
const payloadBytes = readIntegerArg("--payload-bytes", 32);
const keep = process.argv.includes("--keep");
const outputRoot =
  readStringArg("--output-root") ??
  path.join(process.cwd(), "runtime", "benchmarks");

if (eventCount < 0) {
  throw new Error("--events must be non-negative.");
}
if (batchSize < 1) {
  throw new Error("--batch-size must be positive.");
}
if (payloadBytes < 0) {
  throw new Error("--payload-bytes must be non-negative.");
}

await mkdir(outputRoot, {
  recursive: true
});

const archiveRoot = path.join(
  outputRoot,
  `timeline-scan-${eventCount}-${Date.now()}.chron`
);
const builder = createLargeSyntheticTimelineBuilder({
  eventCount,
  payloadBytes
});

const writeStart = performance.now();
const manifest = await builder.writeArchiveFiles({
  rootPath: archiveRoot,
  manifest: createSyntheticArchiveManifest({
    archiveId: `archive-benchmark-${eventCount}`,
    updatedAt: new Date(0).toISOString()
  })
});
const writeMs = performance.now() - writeStart;

const scanStart = performance.now();
let scannedEvents = 0;
let issueCount = 0;
let batchCount = 0;

for await (const batch of readTimelineEventBatches({
  rootPath: archiveRoot,
  relativeTimelinePath: manifest.timeline.path,
  batchSize
})) {
  scannedEvents += batch.events.length;
  issueCount += batch.issues.length;
  batchCount += 1;
}

const scanMs = performance.now() - scanStart;
const archiveBytes = await getDirectorySize(archiveRoot);
const memory = process.memoryUsage();
const result = {
  operation: "timeline-scan",
  archiveRoot,
  archiveBytes,
  eventCount,
  batchSize,
  payloadBytes,
  scannedEvents,
  issueCount,
  batchCount,
  writeMs: Math.round(writeMs),
  scanMs: Math.round(scanMs),
  rssBytes: memory.rss,
  heapUsedBytes: memory.heapUsed,
  keptArchive: keep
};

console.log(JSON.stringify(result, null, 2));

if (!keep) {
  await rm(archiveRoot, {
    recursive: true,
    force: true
  });
}

function readIntegerArg(name, fallback) {
  const value = readStringArg(name);
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${name} must be an integer.`);
  }

  return parsed;
}

function readStringArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return undefined;
  }

  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value.`);
  }

  return value;
}

async function getDirectorySize(rootPath) {
  const entries = await readdir(rootPath, {
    withFileTypes: true
  });
  let total = 0;

  for (const entry of entries) {
    const entryPath = path.join(rootPath, entry.name);
    if (entry.isDirectory()) {
      total += await getDirectorySize(entryPath);
      continue;
    }

    if (entry.isFile()) {
      total += (await stat(entryPath)).size;
    }
  }

  return total;
}
