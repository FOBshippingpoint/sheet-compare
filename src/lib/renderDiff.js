const updateTokens = ["->", "-->", "--->"];

/**
 * @param {unknown[][]} diffRows
 */
export function diffRowsToView(diffRows) {
  const actionIndex = diffRows.some((row) => row[1] === "@@") ? 1 : 0;
  const header = diffRows[0] ?? [];
  const bodyRows = diffRows.slice(1);

  return {
    headers: header.map(stringCell),
    actionIndex,
    orderIndex: actionIndex === 1 ? 0 : -1,
    rows: bodyRows.map((row) => viewRow(row, actionIndex)),
  };
}

function viewRow(row, actionIndex) {
  const action = stringCell(row[actionIndex]);

  return {
    kind: rowKind(action),
    cells: row.map((cell, index) =>
      viewCell(cell, action, index === actionIndex, actionIndex === 1 && index === 0),
    ),
  };
}

function viewCell(cell, action, isActionCell, isOrderCell) {
  let value = stringCell(cell);

  // Make order cell balance
  // e.g, "6:10" => " 6:10"
  if (isOrderCell && value) {
    const [left, right] = value.split(":");
    const size = Math.max(left.length, right.length);
    value = left.padStart(size, "\xa0") + ":" + right.padEnd(size, "\xa0");
  }

  if (!isActionCell && updateTokens.includes(action) && value.includes(action)) {
    const parts = value.split(action);

    return {
      kind: "update-cell",
      left: parts[0],
      right: parts.slice(1).join(action),
      separator: action,
    };
  }

  return {
    kind: isActionCell ? "action-cell" : isOrderCell ? "order-cell" : "value-cell",
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
  function chip(marker, count, label, kind) {
    return { marker, count, label, kind };
  }
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
