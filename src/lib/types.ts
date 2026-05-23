import type * as daff from "daff";

export type TableRows = string[][];

export type SheetSide = "left" | "right";

export type TableFileKind = "csv" | "xlsx";

export type SheetInfo = {
  name: string;
  rowCount: number;
  columnCount: number;
};

export type SelectedTableFile = {
  name: string;
  size: number;
  kind: TableFileKind;
  source: File;
  sheets: SheetInfo[];
  sheetName: string;
  rows: TableRows;
};

export type CompareOptions = {
  show_unchanged: boolean;
  show_unchanged_columns: boolean;
  ignore_whitespace: boolean;
  ignore_case: boolean;
  show_order: boolean;
};

export type DiffResult = {
  diffRows: TableRows;
  summary: daff.DiffSummary;
};

export type TableCellSegment = {
  kind: "left" | "separator" | "right";
  text: string;
};

export type TableCellKind =
  | "label-cell"
  | "value-cell"
  | "action-cell"
  | "order-cell"
  | "update-cell"
  | "header-cell"
  | "body-cell";

export type TableRowKind =
  | "header-row"
  | "insert"
  | "delete"
  | "update"
  | "schema"
  | "omitted"
  | "reorder"
  | "context"
  | "body-row";

export type TableCell = {
  text?: string;
  title?: string;
  kind: TableCellKind;
  rowKind?: TableRowKind;
  segments?: TableCellSegment[];
};

export type SummaryChip = {
  marker: string;
  count: number;
  labelKey: SummaryChipLabel;
  kind: "insert" | "delete" | "update" | "reorder";
};

export type SummaryChipLabel =
  | "rowInserts"
  | "rowDeletes"
  | "rowUpdates"
  | "rowReorders"
  | "columnInserts"
  | "columnDeletes"
  | "columnRenames"
  | "columnReorders";
