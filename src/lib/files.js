import * as XLSX from "xlsx";

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

/**
 * @typedef {{
 *   name: string,
 *   size: number,
 *   kind: 'csv' | 'xlsx',
 *   source: File,
 *   workbook: import('xlsx').WorkBook,
 *   sheets: { name: string, rowCount: number, columnCount: number }[]
 * }} LoadedTableFile
 */

/**
 * @typedef {{
 *   file: LoadedTableFile,
 *   sheetName: string
 * }} SelectedTableFile
 */

/**
 * @param {File} file
 * @returns {Promise<LoadedTableFile>}
 */
export async function loadTableFile(file) {
  const kind = fileKind(file.name);
  const workbook =
    kind === "csv"
      ? XLSX.read(await fileText(file), { ...readOptions, type: "string" })
      : XLSX.read(await fileArrayBuffer(file), { ...readOptions, type: "array" });

  if (!workbook.SheetNames.length) throw new Error(`${file.name} has no sheets.`);

  return {
    name: file.name,
    size: file.size,
    kind,
    source: file,
    workbook,
    sheets: workbook.SheetNames.map((name) => sheetInfo(name, workbook.Sheets[name])),
  };
}

/**
 * @param {File} file
 */
export async function fileText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsText(file);
  });
}

/**
 * @param {File} file
 */
export async function fileArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * @param {SelectedTableFile} selected
 * @returns {string[][]}
 */
export function rowsForSelectedSheet(selected) {
  const rows = XLSX.utils.sheet_to_json(
    selected.file.workbook.Sheets[selected.sheetName],
    jsonOptions,
  );

  if (!rows.length) throw new Error(`${selected.sheetName} has no rows.`);

  return rows;
}

/**
 * @param {string} name
 * @returns {'csv' | 'xlsx'}
 */
function fileKind(name) {
  const lowerName = name.toLowerCase();

  if (lowerName.endsWith(".csv")) return "csv";
  if (lowerName.endsWith(".xlsx")) return "xlsx";

  throw new Error("Choose a CSV or XLSX file.");
}

/**
 * @param {string} name
 * @param {import('xlsx').WorkSheet} sheet
 */
function sheetInfo(name, sheet) {
  if (!sheet["!ref"]) return { name, rowCount: 0, columnCount: 0 };

  const range = XLSX.utils.decode_range(sheet["!ref"]);

  return {
    name,
    rowCount: range.e.r - range.s.r + 1,
    columnCount: range.e.c - range.s.c + 1,
  };
}
