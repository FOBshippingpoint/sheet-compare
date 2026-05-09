import { describe, expect, it } from "vitest";
import { loadTableFile, rowsForSelectedSheet } from "../../src/lib/files.js";

describe("rowsForSelectedSheet", () => {
  const selected = {
    sheetName: "Sheet1",
    file: {
      workbook: {
        Sheets: {
          Sheet1: {
            "!ref": "A1:B3",
            A1: { t: "s", v: "id" },
            B1: { t: "s", v: "name" },
            A2: { t: "s", v: "1" },
            A3: { t: "s", v: "" },
            B3: { t: "s", v: "" },
          },
        },
      },
    },
  };

  it("preserves blank rows and missing cells for daff input", () => {
    expect(rowsForSelectedSheet(selected)).toEqual([
      ["id", "name"],
      ["1", ""],
      ["", ""],
    ]);
  });

  it("prepends row index column with prependIndex", () => {
    expect(rowsForSelectedSheet(selected, { prependIndex: true })).toEqual([
      [1, "id", "name"],
      [2, "1", ""],
      [3, "", ""],
    ]);
  });

  it("prepends column header row with prependHeader", () => {
    expect(rowsForSelectedSheet(selected, { prependHeader: true })).toEqual([
      ["A", "B"],
      ["id", "name"],
      ["1", ""],
      ["", ""],
    ]);
  });

  it("prepends both with prependHeader and prependIndex", () => {
    expect(rowsForSelectedSheet(selected, { prependHeader: true, prependIndex: true })).toEqual([
      ["", "A", "B"],
      [1, "id", "name"],
      [2, "1", ""],
      [3, "", ""],
    ]);
  });
});

describe("loadTableFile", () => {
  it("parses UTF-8 CSV text", async () => {
    const file = new File(["id,name\n1,月村手毬\n2,John Doe\n3,مُحَمَّد\n"], "students.csv", {
      type: "text/csv;charset=utf-8",
    });
    const loaded = await loadTableFile(file);

    expect(rowsForSelectedSheet({ file: loaded, sheetName: loaded.sheets[0].name })).toEqual([
      ["id", "name"],
      ["1", "月村手毬"],
      ["2", "John Doe"],
      ["3", "مُحَمَّد"],
    ]);
  });
});
