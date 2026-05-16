import { describe, expect, it } from "vitest";
import { runDiff } from "../../src/lib/diff.js";
import { rowsForSelectedSheet } from "../../src/lib/files.js";
import { loadSampleFiles, sampleOptions } from "../../src/lib/sample.js";

describe("sampleOptions", () => {
  it("offers CSV and XLSX samples", () => {
    expect(sampleOptions).toEqual([
      { id: "exam-csv", label: "Exam results CSV" },
      { id: "registration-xlsx", label: "Registration results XLSX" },
    ]);
  });
});

describe("loadSampleFiles", () => {
  it("loads exam CSV sample files with visible daff changes", async () => {
    const sample = await loadSampleFiles("exam-csv");
    const result = runDiff(sample.left, sample.right, {
      show_unchanged: false,
      show_unchanged_columns: false,
      ignore_whitespace: false,
      ignore_case: false,
      show_order: true,
    });

    expect(sample.left.name).toBe("sample-exam-left.csv");
    expect(sample.right.name).toBe("sample-exam-right.csv");
    expect(
      result.summary.row_inserts + result.summary.row_deletes + result.summary.row_updates,
    ).toBeGreaterThan(0);
    expect(
      result.summary.col_inserts + result.summary.col_deletes + result.summary.col_renames,
    ).toBeGreaterThan(0);
  });

  it("loads registration XLSX sample with translated headers and 60 left rows", async () => {
    const sample = await loadSampleFiles("registration-xlsx");
    const rows = rowsForSelectedSheet(sample.left);
    const result = runDiff(sample.left, sample.right, {
      show_unchanged: false,
      show_unchanged_columns: false,
      ignore_whitespace: false,
      ignore_case: false,
      show_order: true,
    });

    expect(sample.left.name).toBe("sample-registration-left.xlsx");
    expect(sample.right.name).toBe("sample-registration-right.xlsx");
    expect(rows[0]).toEqual([
      "Registration Result",
      "Name",
      "Department / Year",
      "Email",
      "Phone",
      "Dietary Preference",
    ]);
    expect(rows).toHaveLength(61);
    expect(
      result.summary.row_inserts + result.summary.row_deletes + result.summary.row_updates,
    ).toBeGreaterThan(0);
    expect(result.summary.row_reorders).toBeGreaterThan(0);
    expect(result.diffRows[0]).toEqual(["@:@", "", "A:A", "B:B", "C:C", "D:D", "E:E", "F:F"]);
  });
});
