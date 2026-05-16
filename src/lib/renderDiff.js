/**
 * Chips are UI summaries; do not persist them as standalone report state.
 *
 * @param {Record<string, number>} summary
 */
export function summaryChips(summary) {
  const configs = [
    { marker: "+++", count: summary.row_inserts, label: "row inserts", kind: "insert" },
    { marker: "---", count: summary.row_deletes, label: "row deletes", kind: "delete" },
    { marker: "->",  count: summary.row_updates, label: "row updates", kind: "update" },
    { marker: ":",   count: summary.row_reorders, label: "row reorders", kind: "reorder" },
    { marker: "+++", count: summary.col_inserts, label: "column inserts", kind: "insert" },
    { marker: "---", count: summary.col_deletes, label: "column deletes", kind: "delete" },
    { marker: "()",  count: summary.col_renames, label: "column renames", kind: "update" },
    { marker: ":",   count: summary.col_reorders, label: "column reorders", kind: "reorder" },
  ];
  return configs.filter((item) => item.count);
}
