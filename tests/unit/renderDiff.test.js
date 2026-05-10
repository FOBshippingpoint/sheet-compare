import { describe, expect, it } from "vitest";
import { diffRowsToView, hasChanges, summaryChips } from "../../src/lib/renderDiff.js";

describe("diffRowsToView", () => {
  it("renders daff action rows and splits updated cells with the row token", () => {
    const view = diffRowsToView([
      ["@@", "id", "email"],
      ["-->", "1042", "a@old.com-->a@new.com"],
      ["+++", "1045", "new@example.com"],
      ["---", "1046", "old@example.com"],
      ["...", "", ""],
      [":", "2:1", ""],
      ["!", "", "(role)"],
    ]);

    expect(view.headers).toEqual(["@@", "id", "email"]);
    expect(view.rows.map((row) => row.kind)).toEqual([
      "update",
      "insert",
      "delete",
      "omitted",
      "reorder",
      "schema",
    ]);
    expect(view.rows.every((row) => row.cells[0].kind === "action-cell")).toBe(true);
    expect(view.rows[0].cells[2]).toMatchObject({
      left: "a@old.com",
      separator: "-->",
      right: "a@new.com",
    });
  });

  it("uses the second column as the action column when row and column order labels are present", () => {
    const view = diffRowsToView([
      ["@:@", "", "A:A", "B:B"],
      ["", "@@", "id", "name"],
      ["2:1", ":", "2", "Bob"],
      ["3:2", "->", "3", "Carol->Caroline"],
    ]);

    expect(view.headers).toEqual(["@:@", "", "A:A", "B:B"]);
    expect(view.actionIndex).toBe(1);
    expect(view.orderIndex).toBe(0);
    expect(view.rows.map((row) => row.kind)).toEqual(["context", "reorder", "update"]);
    expect(view.rows[0].cells[0]).toMatchObject({
      kind: "order-cell",
      value: "",
    });
    expect(view.rows[0].cells[1]).toMatchObject({
      kind: "action-cell",
      value: "@@",
    });
    expect(view.rows[1].cells[1]).toMatchObject({
      kind: "action-cell",
      value: ":",
    });
    expect(view.rows[2].cells[1]).toMatchObject({
      kind: "action-cell",
      value: "->",
    });
    expect(view.rows[2].cells[3]).toMatchObject({
      left: "Carol",
      separator: "->",
      right: "Caroline",
    });
  });
});

describe("summaryChips", () => {
  it("keeps only nonzero daff summary values", () => {
    expect(summaryChips({ row_inserts: 2, row_deletes: 0, col_renames: 1 })).toEqual([
      { marker: "+++", count: 2, label: "row inserts", kind: "insert" },
      { marker: "()", count: 1, label: "column renames", kind: "update" },
    ]);
  });

  it("detects an empty daff summary as no changes", () => {
    expect(hasChanges({ row_inserts: 0, row_deletes: 0, row_updates: 0 })).toBe(false);
  });
});
