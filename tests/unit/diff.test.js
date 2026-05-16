import { describe, expect, it } from "vitest";
import { createFlags, runDiffRows } from "../../src/lib/diff.js";

const baseOptions = {
  show_unchanged: false,
  show_unchanged_columns: false,
  ignore_whitespace: false,
  ignore_case: false,
  show_order: true,
};

describe("createFlags", () => {
  it("maps order visibility to both daff order flags", () => {
    expect(createFlags({ ...baseOptions, show_order: true })).toMatchObject({
      always_show_order: true,
      never_show_order: false,
    });
    expect(createFlags({ ...baseOptions, show_order: false })).toMatchObject({
      always_show_order: false,
      never_show_order: true,
    });
  });
});

describe("runDiffRows", () => {
  it("returns daff rows and summary for raw sheet arrays", () => {
    const result = runDiffRows(
      [
        ["id", "name"],
        ["1", "Alice"],
      ],
      [
        ["id", "name"],
        ["1", "Alicia"],
      ],
      baseOptions,
    );

    expect(result.diffRows.length).toBeGreaterThan(0);
    expect(result.summary.row_updates).toBeGreaterThan(0);
  });
});
