import { describe, expect, it } from "vitest";
import { summaryChips } from "../../src/lib/renderDiff.js";

describe("summaryChips", () => {
  it("keeps only nonzero daff summary values", () => {
    expect(summaryChips({ row_inserts: 2, row_deletes: 0, col_renames: 1 })).toEqual([
      { marker: "+++", count: 2, label: "row inserts", kind: "insert" },
      { marker: "()", count: 1, label: "column renames", kind: "update" },
    ]);
  });
});
