import { playwright } from "@vitest/browser-playwright";
import { lingui } from "@lingui/vite-plugin";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [svelte(), lingui()],
  optimizeDeps: {
    include: ["daff"],
  },
  test: {
    include: ["tests/e2e/**/*.test.ts"],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
    },
  },
});
