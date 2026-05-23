import type * as daff from "daff";
import type { SummaryChip } from "./types";

/**
 * Chips are UI summaries; do not persist them as standalone report state.
 */
export function summaryChips(summary: daff.DiffSummary): SummaryChip[] {
  const configs = [
    { marker: "+++", count: summary.row_inserts, labelKey: "rowInserts", kind: "insert" },
    { marker: "---", count: summary.row_deletes, labelKey: "rowDeletes", kind: "delete" },
    { marker: "->", count: summary.row_updates, labelKey: "rowUpdates", kind: "update" },
    { marker: ":", count: summary.row_reorders, labelKey: "rowReorders", kind: "reorder" },
    { marker: "+++", count: summary.col_inserts, labelKey: "columnInserts", kind: "insert" },
    { marker: "---", count: summary.col_deletes, labelKey: "columnDeletes", kind: "delete" },
    { marker: "()", count: summary.col_renames, labelKey: "columnRenames", kind: "update" },
    { marker: ":", count: summary.col_reorders, labelKey: "columnReorders", kind: "reorder" },
  ] satisfies SummaryChip[];
  return configs.filter((item) => item.count);
}
