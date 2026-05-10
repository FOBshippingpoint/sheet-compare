import * as daff from "daff";
import { rowsForSelectedSheet } from "./files.js";

/**
 * @typedef {{
 *   show_unchanged: boolean,
 *   show_unchanged_columns: boolean,
 *   ignore_whitespace: boolean,
 *   ignore_case: boolean
 * }} CompareOptions
 */

/**
 * @param {import('./files.js').SelectedTableFile} left
 * @param {import('./files.js').SelectedTableFile} right
 * @param {CompareOptions} options
 */
export function runDiff(left, right, options) {
  const flags = createFlags(options);
  const alignment = daff
    .compareTables(
      new daff.TableView(rowsForSelectedSheet(left)),
      new daff.TableView(rowsForSelectedSheet(right)),
      flags,
    )
    .align();
  const diffRows = [];
  const tableDiff = new daff.TableDiff(alignment, flags);

  tableDiff.hilite(new daff.TableView(diffRows));

  return {
    diffRows,
    summary: tableDiff.getSummary(),
  };
}

/**
 * @param {CompareOptions} options
 */
function createFlags(options) {
  const flags = new daff.CompareFlags();

  flags.show_unchanged = options.show_unchanged;
  flags.show_unchanged_columns = options.show_unchanged_columns;
  flags.ignore_whitespace = options.ignore_whitespace;
  flags.ignore_case = options.ignore_case;
  flags.never_show_order = false;

  return flags;
}
