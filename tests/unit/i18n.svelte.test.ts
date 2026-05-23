import { describe, expect, it } from "vitest";
import { createI18n } from "../../src/lib/i18n/i18n.svelte";

describe("createI18n", () => {
  it("translates messages with named placeholders", async () => {
    const i18n = createI18n("zh-TW");

    await i18n.activate("zh-TW");

    expect(
      i18n.t("Frozen rows {frozenRows}, frozen columns {frozenCols}", {
        frozenRows: 1,
        frozenCols: 2,
      }),
    ).toBe("凍結列 1，凍結欄 2");

    i18n.destroy();
  });
});
