import { describe, expect, it } from "vitest";
import { loadTableFile, rowsForSelectedSheet } from "../../src/lib/files.js";

describe("rowsForSelectedSheet", () => {
  it("preserves blank rows and missing cells for daff input", () => {
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

    expect(rowsForSelectedSheet(selected)).toEqual([
      ["id", "name"],
      ["1", ""],
      ["", ""],
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
