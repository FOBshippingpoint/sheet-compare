import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { lingui } from "@lingui/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte(), lingui()],
});
