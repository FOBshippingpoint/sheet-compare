import type { TableCell, TableRowKind, TableRows } from "./types";

const updateTokens = ["->", "-->", "--->"] as const;
type UpdateToken = (typeof updateTokens)[number];

export function sourceColumnCount(rows: TableRows): number {
  return rows.reduce((max, row) => Math.max(max, row.length), 0) + 1;
}

export function sourceCell(rows: TableRows, rowIndex: number, columnIndex: number): TableCell {
  if (rowIndex === 0 && columnIndex === 0) return { text: "", kind: "label-cell" };
  if (rowIndex === 0) return { text: columnLabel(columnIndex - 1), kind: "label-cell" };
  if (columnIndex === 0) return { text: String(rowIndex), kind: "label-cell" };

  const text = rows[rowIndex - 1]?.[columnIndex - 1] ?? "";

  return { text, title: text, kind: "value-cell" };
}

export function diffColumnCount(diffRows: TableRows): number {
  return diffRows.reduce((max, row) => Math.max(max, row.length), 0);
}

export function diffCell(diffRows: TableRows, rowIndex: number, columnIndex: number): TableCell {
  const row = diffRows[rowIndex] ?? [];
  const actionIndex = diffActionIndex(diffRows);
  const action = String(row[actionIndex] ?? "");
  const isHeader = rowIndex === 0;
  const isActionCell = columnIndex === actionIndex;
  const isOrderCell = actionIndex === 1 && columnIndex === 0;
  let value = String(row[columnIndex] ?? "");

  if (isOrderCell && value && !isHeader) {
    const [left, right] = value.split(":");
    const size = Math.max(left.length, right.length);
    value = left.padStart(size, "\xa0") + ":" + right.padEnd(size, "\xa0");
  }

  if (!isHeader && !isActionCell && isUpdateToken(action) && value.includes(action)) {
    const parts = value.split(action);

    return {
      kind: "update-cell",
      rowKind: rowKind(action),
      segments: [
        { kind: "left", text: parts[0] },
        { kind: "separator", text: action },
        { kind: "right", text: parts.slice(1).join(action) },
      ],
    };
  }

  return {
    text: value,
    title: value,
    kind: isActionCell ? "action-cell" : isOrderCell ? "order-cell" : "value-cell",
    rowKind: isHeader ? "header-row" : rowKind(action),
  };
}

export function diffActionIndex(diffRows: TableRows): number {
  return diffRows.some((row) => row[1] === "@@") ? 1 : 0;
}

function rowKind(action: string): TableRowKind {
  if (action === "+++") return "insert";
  if (action === "---") return "delete";
  if (isUpdateToken(action)) return "update";
  if (action === "!") return "schema";
  if (action === "...") return "omitted";
  if (action === ":") return "reorder";

  return "context";
}

function columnLabel(index: number): string {
  let label = "";
  let value = index + 1;

  while (value > 0) {
    value--;
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26);
  }

  return label;
}

function isUpdateToken(action: string): action is UpdateToken {
  return updateTokens.includes(action as UpdateToken);
}
