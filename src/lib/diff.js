import * as daff from "daff";

/**
 * @typedef {{
 *   show_unchanged: boolean,
 *   show_unchanged_columns: boolean,
 *   ignore_whitespace: boolean,
 *   ignore_case: boolean,
 *   show_order: boolean
 * }} CompareOptions
 */

/**
 * @param {import('./files.js').SelectedTableFile} left
 * @param {import('./files.js').SelectedTableFile} right
 * @param {CompareOptions} options
 */
export function runDiff(left, right, options) {
  return runDiffRows(left.rows, right.rows, options);
}

/**
 * @param {string[][]} leftRows
 * @param {string[][]} rightRows
 * @param {CompareOptions} options
 */
export function runDiffRows(leftRows, rightRows, options) {
  const flags = createFlags(options);
  const alignment = daff
    .compareTables(new daff.TableView(leftRows), new daff.TableView(rightRows), flags)
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
 * Record both order flags explicitly because daff defaults hide order metadata.
 *
 * @param {CompareOptions} options
 */
export function createFlags(options) {
  const flags = new daff.CompareFlags();

  flags.show_unchanged = options.show_unchanged;
  flags.show_unchanged_columns = options.show_unchanged_columns;
  flags.ignore_whitespace = options.ignore_whitespace;
  flags.ignore_case = options.ignore_case;
  flags.always_show_order = options.show_order;
  flags.never_show_order = !options.show_order;

  return flags;
}
