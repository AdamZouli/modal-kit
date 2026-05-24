import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

const rootDir = resolve(fileURLToPath(new URL(".", import.meta.url)));

export default defineConfig({
  resolve: {
    alias: {
      "@modal-kit/core": resolve(rootDir, "packages/core/src")
    }
  },
  test: {
    include: ["packages/*/src/**/*.test.ts", "packages/*/src/**/*.test.tsx"]
  }
});
