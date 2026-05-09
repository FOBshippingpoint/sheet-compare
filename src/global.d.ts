declare module "daff" {
  export class TableView {
    constructor(data: unknown[][]);
  }

  export class CompareFlags {
    show_unchanged: boolean;
    show_unchanged_columns: boolean;
    ignore_whitespace: boolean;
    ignore_case: boolean;
  }

  export class TableDiff {
    constructor(alignment: unknown, flags: CompareFlags);
    hilite(table: TableView): void;
    getSummary(): Record<string, number>;
  }

  export function compareTables(
    left: TableView,
    right: TableView,
    flags: CompareFlags,
  ): { align(): unknown };
}
