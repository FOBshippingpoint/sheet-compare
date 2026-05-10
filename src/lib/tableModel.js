/**
 * @typedef {{
 *   headerRows: TableRow[],
 *   bodyRows: TableRow[]
 * }} TableModel
 *
 * @typedef {{
 *   id: string,
 *   kind?: string,
 *   cells: TableCell[]
 * }} TableRow
 *
 * @typedef {{
 *   id: string,
 *   text?: string,
 *   title?: string,
 *   kind?: string,
 *   segments?: TableSegment[]
 * }} TableCell
 *
 * @typedef {{
 *   text: string,
 *   kind: 'left' | 'right' | 'separator' | 'marker'
 * }} TableSegment
 */

/**
 * @param {unknown[][]} rows
 * @returns {TableModel}
 */
export function sheetRowsToTable(rows) {
  return {
    headerRows: [sheetRow(rows[0] ?? [], "header-0")],
    bodyRows: rows.slice(1).map((row, index) => sheetRow(row, `row-${index}`)),
  };
}

/**
 * @param {{ headers: string[], actionIndex?: number, orderIndex?: number, rows: { kind: string, cells: unknown[] }[] }} diffView
 * @returns {TableModel}
 */
export function diffViewToTable(diffView) {
  const actionIndex = diffView.actionIndex ?? 0;
  const orderIndex = diffView.orderIndex ?? -1;

  return {
    headerRows: [
      {
        id: "diff-header",
        cells: diffView.headers.map((text, index) => ({
          id: `h-${index}`,
          text,
          kind:
            index === actionIndex
              ? "action-cell"
              : index === orderIndex
                ? "order-cell"
                : "value-cell",
        })),
      },
    ],
    bodyRows: diffView.rows.map((row, rowIndex) => ({
      id: `diff-${rowIndex}`,
      kind: row.kind,
      cells: row.cells.map((cell, cellIndex) => diffCell(cell, rowIndex, cellIndex)),
    })),
  };
}

function sheetRow(row, id) {
  return {
    id,
    cells: row.map((cell, index) => {
      const text = stringCell(cell);

      return {
        id: `${id}-${index}`,
        text,
        title: text,
      };
    }),
  };
}

function diffCell(cell, rowIndex, cellIndex) {
  if (cell.left !== undefined) {
    return {
      id: `${rowIndex}-${cellIndex}`,
      kind: cell.kind,
      segments: [
        { kind: "left", text: cell.left },
        { kind: "separator", text: cell.separator },
        { kind: "right", text: cell.right },
      ],
    };
  }

  return {
    id: `${rowIndex}-${cellIndex}`,
    text: cell.value,
    title: cell.value,
    kind: cell.kind,
  };
}

function stringCell(value) {
  return value == null ? "" : String(value);
}
