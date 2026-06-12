import path from "node:path";

export function assertNoShellMetacharacters(value: string, label: string): void {
  if (/[\r\n]/.test(value)) {
    throw new Error(`${label} must not contain newlines.`);
  }
}

export function assertOutputWithinWorkingDirectory(
  workingDirectory: string,
  outputPath: string
): void {
  const relative = path.relative(workingDirectory, outputPath);
  if (
    relative.length === 0 ||
    relative.startsWith("..") ||
    path.isAbsolute(relative)
  ) {
    throw new Error("Output path must stay within the working directory.");
  }
}

export function redactPath(value: string, sensitivity: string): string {
  return sensitivity === "safe" ? value : `<redacted:${sensitivity}:path>`;
}
