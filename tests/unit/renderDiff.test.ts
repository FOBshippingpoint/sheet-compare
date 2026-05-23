import { describe, expect, it } from "vitest";
import { summaryChips } from "../../src/lib/renderDiff";
import * as daff from "daff";

const emptySummary: daff.DiffSummary = {
  row_deletes: 0,
  row_inserts: 0,
  row_updates: 0,
  row_reorders: 0,
  col_deletes: 0,
  col_inserts: 0,
  col_updates: 0,
  col_renames: 0,
  col_reorders: 0,
  row_count_initial_with_header: 0,
  row_count_final_with_header: 0,
  row_count_initial: 0,
  row_count_final: 0,
  col_count_initial: 0,
  col_count_final: 0,
  different: false,
};

describe("summaryChips", () => {
  it("keeps only nonzero daff summary values", () => {
    expect(summaryChips({ ...emptySummary, row_inserts: 2, col_renames: 1 })).toEqual([
      { marker: "+++", count: 2, labelKey: "rowInserts", kind: "insert" },
      { marker: "()", count: 1, labelKey: "columnRenames", kind: "update" },
    ]);
  });
});
