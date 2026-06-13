import { parseAdapterManifestV1 } from "@chronarium/schemas";
import type { AdapterId, AdapterManifest } from "@chronarium/types";

export interface AdapterCatalogOptions {
  readonly manifests: readonly AdapterManifest[];
}

export interface AdapterCatalog {
  listAdapters(): readonly AdapterManifest[];
  getAdapter(adapterId: AdapterId): AdapterManifest | undefined;
}

export function createAdapterCatalog(
  options: AdapterCatalogOptions
): AdapterCatalog {
  return new InMemoryAdapterCatalog(options.manifests);
}

class InMemoryAdapterCatalog implements AdapterCatalog {
  private readonly manifestsById = new Map<AdapterId, AdapterManifest>();

  constructor(manifests: readonly AdapterManifest[]) {
    for (const manifest of manifests) {
      const parsedManifest = parseAdapterManifestV1(manifest);
      if (this.manifestsById.has(parsedManifest.adapterId)) {
        throw new Error(`Duplicate adapter manifest id: ${parsedManifest.adapterId}`);
      }
      if (parsedManifest.security.emitsSensitiveSourceFields) {
        throw new Error(
          `Adapter ${parsedManifest.adapterId} declares sensitive source field emission.`
        );
      }
      this.manifestsById.set(parsedManifest.adapterId, parsedManifest);
    }
  }

  listAdapters(): readonly AdapterManifest[] {
    return Array.from(this.manifestsById.values());
  }

  getAdapter(adapterId: AdapterId): AdapterManifest | undefined {
    return this.manifestsById.get(adapterId);
  }
}
