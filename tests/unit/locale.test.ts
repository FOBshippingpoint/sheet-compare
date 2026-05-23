import { describe, expect, it } from "vitest";
import { localeForLanguageTag, resolveLocale } from "../../src/lib/i18n/locale";

describe("localeForLanguageTag", () => {
  it("maps supported BCP 47 language tags to app locales", () => {
    expect(localeForLanguageTag("en-US")).toBe("en");
    expect(localeForLanguageTag("zh-TW")).toBe("zh-TW");
    expect(localeForLanguageTag("zh-Hant")).toBe("zh-TW");
  });
});

describe("resolveLocale", () => {
  it("uses saved locale before browser preferences", () => {
    expect(resolveLocale({ savedLocale: "zh-TW", languages: ["en-US"] })).toBe("zh-TW");
  });

  it("falls back to English for unsupported preferences", () => {
    expect(resolveLocale({ savedLocale: null, languages: ["ja-JP"] })).toBe("en");
  });
});
