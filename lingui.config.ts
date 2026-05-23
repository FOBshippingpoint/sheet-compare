import { defineConfig } from "@lingui/conf";
import { formatter } from "@lingui/format-po";

export default defineConfig({
  locales: ["en", "zh-TW"],
  sourceLocale: "en",
  compileNamespace: "ts",
  format: formatter({ explicitIdAsDefault: true }),
  catalogs: [
    {
      path: "<rootDir>/src/lib/i18n/locales/{locale}",
      include: ["src/**/*.ts"],
      exclude: ["src/lib/i18n/locales/**", "src/**/*.test.ts"],
    },
  ],
});
