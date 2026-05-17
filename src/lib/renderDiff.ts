import type * as daff from "daff";
import type { SummaryChip } from "./types";

/**
 * Chips are UI summaries; do not persist them as standalone report state.
 */
export function summaryChips(summary: daff.DiffSummary): SummaryChip[] {
  const configs = [
    { marker: "+++", count: summary.row_inserts, label: "row inserts", kind: "insert" },
    { marker: "---", count: summary.row_deletes, label: "row deletes", kind: "delete" },
    { marker: "->", count: summary.row_updates, label: "row updates", kind: "update" },
    { marker: ":", count: summary.row_reorders, label: "row reorders", kind: "reorder" },
    { marker: "+++", count: summary.col_inserts, label: "column inserts", kind: "insert" },
    { marker: "---", count: summary.col_deletes, label: "column deletes", kind: "delete" },
    { marker: "()", count: summary.col_renames, label: "column renames", kind: "update" },
    { marker: ":", count: summary.col_reorders, label: "column reorders", kind: "reorder" },
  ] satisfies SummaryChip[];
  return configs.filter((item) => item.count);
}
