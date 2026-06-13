import type { ResolvedCredentialJar } from "@chronarium/types";

/**
 * Backend-agnostic credential vault. It maps a profile's opaque `storageHandle`
 * to a resolved jar. This in-memory implementation is fixture-only: it holds
 * synthetic jars in memory, performs no disk IO and no encryption, and exposes
 * no serialization. The real at-rest encrypted backend (OS keystore preferred,
 * passphrase fallback) will implement the same interface in a later, approved
 * live slice. See `docs/CREDENTIALS_AND_SESSIONS.md`.
 */
export interface CredentialVault {
  importSecret(input: {
    readonly storageHandle: string;
    readonly jar: ResolvedCredentialJar;
  }): void;
  hasSecret(storageHandle: string): boolean;
  resolveJar(storageHandle: string): ResolvedCredentialJar;
}

export function createInMemoryCredentialVault(): CredentialVault {
  const secrets = new Map<string, ResolvedCredentialJar>();

  return {
    importSecret: ({ storageHandle, jar }) => {
      if (storageHandle.length === 0) {
        throw new Error("storageHandle must not be empty.");
      }
      secrets.set(storageHandle, jar);
    },
    hasSecret: (storageHandle) => secrets.has(storageHandle),
    resolveJar: (storageHandle) => {
      const jar = secrets.get(storageHandle);
      if (!jar) {
        throw new Error(
          `No credential jar stored for handle ${storageHandle}.`
        );
      }
      return jar;
    }
  };
}
