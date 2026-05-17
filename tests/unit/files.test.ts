import { describe, expect, it } from "vitest";
import { loadTableFile, rowsForSelectedSheet, rowsForWorksheet } from "../../src/lib/files";

describe("rowsForWorksheet", () => {
  const sheet = {
    "!ref": "A1:B3",
    A1: { t: "s", v: "id" },
    B1: { t: "s", v: "name" },
    A2: { t: "s", v: "1" },
    A3: { t: "s", v: "" },
    B3: { t: "s", v: "" },
  };

  it("returns rectangular displayed rows", () => {
    expect(rowsForWorksheet(sheet, "Sheet1")).toEqual([
      ["id", "name"],
      ["1", ""],
      ["", ""],
    ]);
  });
});

describe("loadTableFile", () => {
  it("stores the selected sheet as raw rows", async () => {
    const file = new File(["id,name\n1,月村手毬\n2,John Doe\n3,مُحَمَّد\n"], "students.csv", {
      type: "text/csv;charset=utf-8",
    });
    const loaded = await loadTableFile(file);

    expect(loaded.name).toBe("students.csv");
    expect(loaded.sheetName).toBe(loaded.sheets[0].name);
    expect(rowsForSelectedSheet(loaded)).toEqual([
      ["id", "name"],
      ["1", "月村手毬"],
      ["2", "John Doe"],
      ["3", "مُحَمَّد"],
    ]);
  });
});
