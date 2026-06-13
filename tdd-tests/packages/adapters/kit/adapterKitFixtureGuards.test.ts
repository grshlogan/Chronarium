import {
  assertNoSensitiveFixtureStrings,
  assertSyntheticFixtureReference,
  expectPositiveInteger,
  expectString,
  optionalStringProperty
} from "@chronarium/adapter-kit";
import { describe, expect, it } from "vitest";

const PREFIX = "fixture://example/";

describe("adapter-kit synthetic fixture reference guard", () => {
  it("accepts a synthetic reference that uses the expected prefix", () => {
    expect(() =>
      assertSyntheticFixtureReference(
        "fixture://example/playlist.m3u8",
        "topology.playlistReference",
        PREFIX
      )
    ).not.toThrow();
  });

  it("rejects a raw network reference and names the expected prefix", () => {
    expect(() =>
      assertSyntheticFixtureReference(
        "https://example.invalid/playlist.m3u8",
        "topology.playlistReference",
        PREFIX
      )
    ).toThrow(/fixture:\/\/example\//);
  });

  it("rejects a reference that carries a query string", () => {
    expect(() =>
      assertSyntheticFixtureReference(
        "fixture://example/playlist.m3u8?token=secret",
        "topology.playlistReference",
        PREFIX
      )
    ).toThrow(/query strings/);
  });
});

describe("adapter-kit sensitive fixture string scan", () => {
  it("passes a clean nested fixture value", () => {
    expect(() =>
      assertNoSensitiveFixtureStrings(
        { note: "synthetic gap", ids: ["seg-1", "seg-2"] },
        "evidence"
      )
    ).not.toThrow();
  });

  it("rejects a nested network URL", () => {
    expect(() =>
      assertNoSensitiveFixtureStrings(
        { nested: ["https://example.invalid/x"] },
        "evidence"
      )
    ).toThrow(/network URLs/);
  });

  it("rejects a nested secret-looking fragment", () => {
    expect(() =>
      assertNoSensitiveFixtureStrings({ auth: "bearer abc" }, "evidence")
    ).toThrow(/forbidden sensitive fragment/);
  });
});

describe("adapter-kit fixture parse guards", () => {
  it("rejects a non-positive integer", () => {
    expect(() => expectPositiveInteger(0, "durationMs")).toThrow(
      /positive integer/
    );
  });

  it("rejects an empty string", () => {
    expect(() => expectString("", "id")).toThrow(/non-empty string/);
  });

  it("omits an optional string property when undefined", () => {
    expect(optionalStringProperty("label", undefined, "label")).toEqual({});
  });
});
