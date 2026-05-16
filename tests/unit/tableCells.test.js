import { describe, expect, it } from "vitest";
import {
  diffActionIndex,
  diffCell,
  sourceCell,
  sourceColumnCount,
} from "../../src/lib/tableCells.js";

describe("sourceCell", () => {
  it("keeps spreadsheet labels separate from source rows", () => {
    const rows = [["id", "name"]];

    expect(sourceColumnCount(rows)).toBe(3);
    expect(sourceCell(rows, 0, 1)).toMatchObject({ text: "A", kind: "label-cell" });
    expect(sourceCell(rows, 1, 0)).toMatchObject({ text: "1", kind: "label-cell" });
    expect(sourceCell(rows, 1, 1)).toMatchObject({ text: "id", kind: "value-cell" });
  });
});

describe("diffCell", () => {
  it("handles diff rows without order labels", () => {
    const rows = [
      ["@@", "id", "email"],
      ["-->", "1042", "a@old.com-->a@new.com"],
    ];

    expect(diffActionIndex(rows)).toBe(0);
    expect(diffCell(rows, 1, 0)).toMatchObject({ text: "-->", kind: "action-cell" });
    expect(diffCell(rows, 1, 2).segments).toEqual([
      { kind: "left", text: "a@old.com" },
      { kind: "separator", text: "-->" },
      { kind: "right", text: "a@new.com" },
    ]);
  });

  it("handles diff rows with order labels", () => {
    const rows = [
      ["@:@", "", "A:A", "B:B"],
      ["", "@@", "id", "name"],
      ["2:1", ":", "2", "Bob"],
    ];

    expect(diffActionIndex(rows)).toBe(1);
    expect(diffCell(rows, 2, 0)).toMatchObject({ kind: "order-cell" });
    expect(diffCell(rows, 2, 1)).toMatchObject({ text: ":", kind: "action-cell" });
  });
});
