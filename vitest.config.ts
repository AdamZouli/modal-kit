import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

const rootDir = resolve(fileURLToPath(new URL(".", import.meta.url)));

export default defineConfig({
  resolve: {
    alias: {
      "@modal-kit/core": resolve(rootDir, "packages/core/src"),
      "@modal-kit/ui": resolve(rootDir, "packages/ui/src"),
      "@modal-kit/react": resolve(rootDir, "packages/react/src"),
      "@modal-kit/vue": resolve(rootDir, "packages/vue/src"),
      "@modal-kit/web-components": resolve(rootDir, "packages/web-components/src")
    }
  },
  test: {
    environment: "jsdom",
    include: ["packages/*/src/**/*.test.ts", "packages/*/src/**/*.test.tsx"]
  }
});
