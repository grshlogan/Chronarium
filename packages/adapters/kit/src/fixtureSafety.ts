/**
 * Shared fixture-safety guards for site adapters.
 *
 * These guards are the per-adapter line of defense that keeps synthetic
 * fixtures free of real network URLs, query strings, and secret-looking
 * fragments. They live here so every site adapter validates references the
 * same way instead of copy-pasting drifting checks.
 */

const FORBIDDEN_REFERENCE_FRAGMENTS = [
  "cookie",
  "token",
  "session",
  "signature",
  "authorization",
  "bearer"
] as const;

const FORBIDDEN_STRING_FRAGMENTS = [
  "cookie",
  "token",
  "session=",
  "signature",
  "authorization",
  "bearer",
  "signed"
] as const;

/**
 * Assert that a fixture reference is a synthetic `expectedPrefix` reference and
 * carries no query string, fragment, or secret-looking token.
 */
export function assertSyntheticFixtureReference(
  reference: string,
  path: string,
  expectedPrefix: string
): void {
  const lowerReference = reference.toLowerCase();

  if (!reference.startsWith(expectedPrefix)) {
    throw new Error(`${path} must use a synthetic ${expectedPrefix} reference.`);
  }

  if (reference.includes("?") || reference.includes("#")) {
    throw new Error(`${path} must not contain query strings or fragments.`);
  }

  if (
    FORBIDDEN_REFERENCE_FRAGMENTS.some((fragment) =>
      lowerReference.includes(fragment)
    )
  ) {
    throw new Error(`${path} contains a forbidden sensitive fragment.`);
  }
}

/**
 * Recursively assert that a fixture value contains no raw network URL or
 * secret-looking string fragment.
 */
export function assertNoSensitiveFixtureStrings(
  value: unknown,
  path: string
): void {
  if (typeof value === "string") {
    const lowerValue = value.toLowerCase();

    if (lowerValue.startsWith("http://") || lowerValue.startsWith("https://")) {
      throw new Error(`${path} must not contain network URLs.`);
    }

    if (
      FORBIDDEN_STRING_FRAGMENTS.some((fragment) => lowerValue.includes(fragment))
    ) {
      throw new Error(`${path} contains a forbidden sensitive fragment.`);
    }

    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertNoSensitiveFixtureStrings(item, `${path}[${index}]`)
    );
    return;
  }

  if (typeof value === "object" && value !== null) {
    Object.entries(value).forEach(([key, item]) =>
      assertNoSensitiveFixtureStrings(item, `${path}.${key}`)
    );
  }
}
