export type ChronariumId = string;
export type AdapterId = string;
export type SiteId = string;
export type IsoDateTimeString = string;
export type RelativeArchivePath = string;
export type Sha256Hex = string;

export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { readonly [key: string]: JsonValue };
export type JsonArray = readonly JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export type RedactionStatus =
  | "safe"
  | "synthetic"
  | "redacted"
  | "contains-sensitive"
  | "unknown";
