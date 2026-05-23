import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { lingui } from "@lingui/vite-plugin";

export default defineConfig({
  plugins: [svelte(), lingui()],
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.ts"],
  },
});
