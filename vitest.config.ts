import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

const sourceAlias = (path: string): string =>
  fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    include: ["packages/**/*.test.ts", "tdd-tests/**/*.test.ts?(x)"]
  },
  resolve: {
    alias: {
      "@chronarium/types": sourceAlias("./packages/types/src/index.ts"),
      "@chronarium/schemas": sourceAlias("./packages/schemas/src/index.ts"),
      "@chronarium/archive": sourceAlias("./packages/archive/src/index.ts"),
      "@chronarium/core": sourceAlias("./packages/core/src/index.ts"),
      "@chronarium/indexer": sourceAlias("./packages/indexer/src/index.ts"),
      "@chronarium/desktop": sourceAlias("./apps/desktop/src/index.ts"),
      "@chronarium/adapter-chaturbate": sourceAlias(
        "./packages/adapters/chaturbate/src/index.ts"
      ),
      "@chronarium/adapter-stripchat": sourceAlias(
        "./packages/adapters/stripchat/src/index.ts"
      ),
      "@chronarium/testkit": sourceAlias("./packages/testkit/src/index.ts")
    }
  }
});
