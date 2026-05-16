import fs from "node:fs/promises";
import path from "node:path";
import * as XLSX from "xlsx";
import { runDiffRows } from "../src/lib/diff.js";
import { loadTableFile } from "../src/lib/files.js";

const [, , command, ...args] = process.argv;

if (command === "sheet") {
  const [filePath, sheetName] = args;
  const selected = await loadTableFile(await fileFor(filePath), sheetName);

  console.log(
    JSON.stringify(
      {
        name: selected.name,
        sheets: selected.sheets,
        sheetName: selected.sheetName,
        rows: selected.rows,
      },
      null,
      2,
    ),
  );
} else if (command === "diff") {
  const [leftPath, rightPath, ...flags] = args;
  const options = parseFlags(flags);
  const left = await loadTableFile(await fileFor(leftPath), options.leftSheet);
  const right = await loadTableFile(await fileFor(rightPath), options.rightSheet);
  const result = runDiffRows(left.rows, right.rows, {
    show_unchanged: false,
    show_unchanged_columns: false,
    ignore_whitespace: false,
    ignore_case: false,
    show_order: options.showOrder,
  });

  console.log(JSON.stringify(result, null, 2));
} else {
  console.error(`Usage:
  bun run playground sheet <file> [sheet]
  bun run playground diff <left> <right> [--left-sheet X] [--right-sheet Y] [--show-order true|false]`);
  process.exit(1);
}

async function fileFor(filePath) {
  const bytes = await fs.readFile(filePath);
  const name = path.basename(filePath);

  return new File([bytes], name, { type: mimeFor(name) });
}

function parseFlags(flags) {
  const options = {
    leftSheet: undefined,
    rightSheet: undefined,
    showOrder: true,
  };

  for (let index = 0; index < flags.length; index += 2) {
    const name = flags[index];
    const value = flags[index + 1];

    if (name === "--left-sheet") options.leftSheet = value;
    else if (name === "--right-sheet") options.rightSheet = value;
    else if (name === "--show-order") options.showOrder = value !== "false";
    else throw new Error(`Unknown option: ${name}`);
  }

  return options;
}

function mimeFor(name) {
  if (name.toLowerCase().endsWith(".csv")) return "text/csv";
  if (name.toLowerCase().endsWith(".xlsx")) {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }

  return "application/octet-stream";
}
