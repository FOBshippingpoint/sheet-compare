import * as daff from "daff";
import type { CompareOptions, DiffResult, SelectedTableFile, TableRows } from "./types";

export function runDiff(
  left: SelectedTableFile,
  right: SelectedTableFile,
  options: CompareOptions,
): DiffResult {
  return runDiffRows(left.rows, right.rows, options);
}

export function runDiffRows(
  leftRows: TableRows,
  rightRows: TableRows,
  options: CompareOptions,
): DiffResult {
  const flags = createFlags(options);
  const alignment = daff
    .compareTables(new daff.TableView(leftRows), new daff.TableView(rightRows), flags)
    .align();
  const diffRows: TableRows = [];
  const tableDiff = new daff.TableDiff(alignment, flags);

  tableDiff.hilite(new daff.TableView(diffRows));

  return {
    diffRows,
    summary: tableDiff.getSummary(),
  };
}

/**
 * Record both order flags explicitly because daff defaults hide order metadata.
 *
 */
export function createFlags(options: CompareOptions): daff.CompareFlags {
  const flags = new daff.CompareFlags();

  flags.show_unchanged = options.show_unchanged;
  flags.show_unchanged_columns = options.show_unchanged_columns;
  flags.ignore_whitespace = options.ignore_whitespace;
  flags.ignore_case = options.ignore_case;
  flags.always_show_order = options.show_order;
  flags.never_show_order = !options.show_order;

  return flags;
}
