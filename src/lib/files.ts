import * as XLSX from "xlsx";
import type { SelectedTableFile, SheetInfo, TableFileKind, TableRows } from "./types";

const readOptions = {
  cellFormula: false,
  cellHTML: false,
  dateNF: "yyyy-mm-dd",
};

const jsonOptions = {
  header: 1,
  raw: false,
  defval: "",
  blankrows: true,
  dateNF: "yyyy-mm-dd",
};

export async function loadTableFile(file: File, sheetName?: string): Promise<SelectedTableFile> {
  const kind = fileKind(file.name);
  const workbook =
    kind === "csv"
      ? XLSX.read(await fileText(file), { ...readOptions, type: "string" })
      : XLSX.read(await fileArrayBuffer(file), { ...readOptions, type: "array" });

  if (!workbook.SheetNames.length) throw new Error(`${file.name} has no sheets.`);

  const sheets = workbook.SheetNames.map((name) => sheetInfo(name, workbook.Sheets[name]));
  const selectedSheetName = sheetName ?? sheets[0].name;
  const rows = rowsForWorksheet(workbook.Sheets[selectedSheetName], selectedSheetName);

  return {
    name: file.name,
    size: file.size,
    kind,
    source: file,
    sheets,
    sheetName: selectedSheetName,
    rows,
  };
}

export async function fileText(file: File): Promise<string> {
  if (file.text) return file.text();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => resolve(String(reader.result ?? "")));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsText(file);
  });
}

export async function fileArrayBuffer(file: File): Promise<ArrayBuffer> {
  if (file.arrayBuffer) return file.arrayBuffer();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => resolve(reader.result as ArrayBuffer));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsArrayBuffer(file);
  });
}

export function rowsForSelectedSheet(selected: SelectedTableFile): TableRows {
  return selected.rows;
}

/**
 * Keep the canonical sheet value free of UI labels so daff, export, and preview all
 * share the same source rows. Spreadsheet headers and row numbers are render-only.
 */
export function rowsForWorksheet(sheet: XLSX.WorkSheet | undefined, sheetName: string): TableRows {
  if (!sheet) throw new Error(`${sheetName} was not found.`);

  const rows = XLSX.utils
    .sheet_to_json<unknown[]>(sheet, jsonOptions)
    .map((row) => row.map((cell) => (cell == null ? "" : String(cell))));

  if (!rows.length) throw new Error(`${sheetName} has no rows.`);

  return rows;
}

function fileKind(name: string): TableFileKind {
  const lowerName = name.toLowerCase();

  if (lowerName.endsWith(".csv")) return "csv";
  if (lowerName.endsWith(".xlsx")) return "xlsx";

  throw new Error("Choose a CSV or XLSX file.");
}

function sheetInfo(name: string, sheet: XLSX.WorkSheet | undefined): SheetInfo {
  if (!sheet?.["!ref"]) return { name, rowCount: 0, columnCount: 0 };

  const range = XLSX.utils.decode_range(sheet["!ref"]);

  return {
    name,
    rowCount: range.e.r - range.s.r + 1,
    columnCount: range.e.c - range.s.c + 1,
  };
}
