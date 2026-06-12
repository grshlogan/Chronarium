export type MediaToolName = "ffmpeg" | "ffprobe";

export type MediaToolSensitivity = "safe" | "synthetic" | "redacted";

export interface MediaToolCommand {
  readonly tool: MediaToolName;
  readonly executablePath: string;
  readonly argv: readonly string[];
  readonly redactedArgv: readonly string[];
  readonly workingDirectory: string;
  readonly timeoutMs: number;
  readonly sensitivity: MediaToolSensitivity;
  readonly expectedOutput: string;
}

export interface MediaToolInputRef {
  readonly path: string;
  readonly sensitivity: MediaToolSensitivity;
}

export interface MediaToolOutputRef {
  readonly path: string;
  readonly sensitivity: MediaToolSensitivity;
}

export interface MediaToolBinaryRef {
  readonly executablePath: string;
  readonly origin: "user-settings" | "system-path" | "bundled";
}
