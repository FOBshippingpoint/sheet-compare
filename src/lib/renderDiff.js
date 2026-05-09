const updateTokens = ["->", "-->", "--->"];

/**
 * @param {unknown[][]} diffRows
 */
export function diffRowsToView(diffRows) {
  const headerIndex = diffRows.findIndex((row) => row[0] === "@@");
  const header = headerIndex === -1 ? diffRows[0] : diffRows[headerIndex];
  const bodyRows = diffRows.filter((_, index) => index !== headerIndex);

  return {
    headers: header.map(stringCell),
    rows: bodyRows.map(viewRow),
  };
}

function viewRow(row) {
  const action = stringCell(row[0]);

  return {
    kind: rowKind(action),
    cells: row.map((cell, index) => viewCell(cell, action, index)),
  };
}

function viewCell(cell, action, index) {
  const value = stringCell(cell);

  if (index > 0 && updateTokens.includes(action) && value.includes(action)) {
    const parts = value.split(action);

    return {
      kind: "update-cell",
      left: parts[0],
      right: parts.slice(1).join(action),
      separator: action,
    };
  }

  return {
    kind: index === 0 ? "action-cell" : "value-cell",
    value,
  };
}

function rowKind(action) {
  if (action === "+++") return "insert";
  if (action === "---") return "delete";
  if (updateTokens.includes(action)) return "update";
  if (action === "!") return "schema";
  if (action === "...") return "omitted";
  if (action === ":") return "reorder";

  return "context";
}

function stringCell(value) {
  return value == null ? "" : String(value);
}

/**
 * @param {Record<string, number>} summary
 */
export function summaryChips(summary) {
  return [
    chip("+++", summary.row_inserts, "row inserts", "insert"),
    chip("---", summary.row_deletes, "row deletes", "delete"),
    chip("->", summary.row_updates, "row updates", "update"),
    chip(":", summary.row_reorders, "row reorders", "reorder"),
    chip("+++", summary.col_inserts, "column inserts", "insert"),
    chip("---", summary.col_deletes, "column deletes", "delete"),
    chip("()", summary.col_renames, "column renames", "update"),
    chip(":", summary.col_reorders, "column reorders", "reorder"),
  ].filter((item) => item.count);
}

/**
 * @param {Record<string, number>} summary
 */
export function hasChanges(summary) {
  return summaryChips(summary).length > 0;
}

function chip(marker, count, label, kind) {
  return { marker, count, label, kind };
}
