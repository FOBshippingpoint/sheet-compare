import { describe, expect, it } from "vitest";
import { offsetsFor, nearestOffsetIndex, clamp } from "../../src/lib/freezeMath.js";
import { diffViewToTable, sheetRowsToTable } from "../../src/lib/tableModel.js";

describe("sheetRowsToTable", () => {
  it("uses the first row as headers and the remaining rows as body rows", () => {
    expect(
      sheetRowsToTable([
        ["id", "name"],
        ["1", "Alice"],
      ]),
    ).toMatchObject({
      headerRows: [{ cells: [{ text: "id" }, { text: "name" }] }],
      bodyRows: [{ cells: [{ text: "1" }, { text: "Alice" }] }],
    });
  });

  it("returns a valid empty table model", () => {
    expect(sheetRowsToTable([])).toEqual({
      headerRows: [{ id: "header-0", cells: [] }],
      bodyRows: [],
    });
  });
});

describe("diffViewToTable", () => {
  it("preserves diff row kinds, action cells, and update segments", () => {
    const table = diffViewToTable({
      headers: ["@@", "id", "email"],
      rows: [
        {
          kind: "update",
          cells: [
            { kind: "action-cell", value: "-->" },
            { kind: "value-cell", value: "1042" },
            {
              kind: "update-cell",
              left: "old@example.com",
              separator: "-->",
              right: "new@example.com",
            },
          ],
        },
      ],
    });

    expect(table.headerRows[0].cells[0]).toMatchObject({
      text: "@@",
      kind: "action-cell",
    });
    expect(table.bodyRows[0].kind).toBe("update");
    expect(table.bodyRows[0].cells[0]).toMatchObject({
      text: "-->",
      kind: "action-cell",
    });
    expect(table.bodyRows[0].cells[2].segments).toEqual([
      { kind: "left", text: "old@example.com" },
      { kind: "separator", text: "-->" },
      { kind: "right", text: "new@example.com" },
    ]);
  });
});

describe("freeze math", () => {
  it("calculates boundary offsets and nearest snap indexes", () => {
    const offsets = offsetsFor([20, 30, 40]);

    expect(offsets).toEqual([0, 20, 50, 90]);
    expect(nearestOffsetIndex(offsets, 44)).toBe(2);
    expect(clamp(0, 6, 3)).toBe(3);
  });
});
