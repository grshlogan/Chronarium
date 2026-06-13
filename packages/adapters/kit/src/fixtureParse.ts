/**
 * Shared fixture-parsing primitives for site adapters.
 *
 * These are small typed `expect*` guards used to turn untyped fixture JSON into
 * validated adapter fixture objects. They are shared so every site adapter
 * parses with identical rules and error messages.
 */
import type { JsonObject, JsonValue } from "@chronarium/types";

export function expectRecord(
  value: unknown,
  path: string
): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${path} must be an object.`);
  }

  return value as Record<string, unknown>;
}

export function expectArray(value: unknown, path: string): readonly unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${path} must be an array.`);
  }

  return value;
}

export function expectOptionalArray(
  value: unknown,
  path: string
): readonly unknown[] {
  if (value === undefined) {
    return [];
  }

  return expectArray(value, path);
}

export function expectString(value: unknown, path: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${path} must be a non-empty string.`);
  }

  return value;
}

export function optionalStringProperty<K extends string>(
  key: K,
  value: unknown,
  path: string
): Partial<Record<K, string>> {
  if (value === undefined) {
    return {};
  }

  return {
    [key]: expectString(value, path)
  } as Partial<Record<K, string>>;
}

export function expectJsonObject(value: unknown, path: string): JsonObject {
  const record = expectRecord(value, path);
  const output: Record<string, JsonValue> = {};

  Object.entries(record).forEach(([key, item]) => {
    output[key] = expectJsonValue(item, `${path}.${key}`);
  });

  return output;
}

export function expectJsonValue(value: unknown, path: string): JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(`${path} must be a finite JSON number.`);
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => expectJsonValue(item, `${path}[${index}]`));
  }

  if (typeof value === "object" && value !== null) {
    return expectJsonObject(value, path);
  }

  throw new Error(`${path} must be a JSON-compatible value.`);
}

export function expectNumber(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${path} must be a finite number.`);
  }

  return value;
}

export function expectOptionalNumber(
  value: unknown,
  path: string,
  fallback: number
): number {
  if (value === undefined) {
    return fallback;
  }

  return expectNumber(value, path);
}

export function expectNonNegativeInteger(value: unknown, path: string): number {
  const numberValue = expectNumber(value, path);
  if (!Number.isInteger(numberValue) || numberValue < 0) {
    throw new Error(`${path} must be a non-negative integer.`);
  }

  return numberValue;
}

export function expectPositiveInteger(value: unknown, path: string): number {
  const numberValue = expectNumber(value, path);
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw new Error(`${path} must be a positive integer.`);
  }

  return numberValue;
}
