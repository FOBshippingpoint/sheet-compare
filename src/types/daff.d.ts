declare module "daff" {
  export type Datum = unknown;
  export type NativeCell = string | number | boolean | null;
  export type NativeRows = NativeCell[][];
  export type HaxeMap<V> = Record<string, V>;

  export interface View {
    toString(d: Datum): string;
    equals(d1: Datum, d2: Datum): boolean;
    toDatum(str: string): Datum;
    makeHash(): Record<string, Datum>;
    hashSet(h: Record<string, Datum>, str: string, d: Datum): void;
    isHash(h: Datum): boolean;
    hashExists(h: Record<string, Datum>, str: string): boolean;
    hashGet(h: Record<string, Datum>, str: string): Datum;
    isTable(t: Datum): boolean;
    getTable(t: Datum): Table;
    wrapTable(t: Table): Datum;
  }

  export interface RowStream {
    fetchColumns(): string[];
    fetchRow(): HaxeMap<Datum> | null;
  }

  export interface Meta {
    alterColumns(columns: ColumnChange[]): boolean;
    changeRow(rc: RowChange): boolean;
    applyFlags(flags: CompareFlags): boolean;
    asTable(): Table;
    cloneMeta(table?: Table | null): Meta;
    useForColumnChanges(): boolean;
    useForRowChanges(): boolean;
    getRowStream(): RowStream | null;
    isNested(): boolean;
    isSql(): boolean;
    getName(): string | null;
  }

  export interface Table {
    readonly height: number;
    readonly width: number;
    getCell(x: number, y: number): Datum;
    setCell(x: number, y: number, c: Datum): void;
    getCellView(): View;
    isResizable(): boolean;
    resize(w: number, h: number): boolean;
    clear(): void;
    insertOrDeleteRows(fate: number[], hfate: number): boolean;
    insertOrDeleteColumns(fate: number[], wfate: number): boolean;
    trimBlank(): boolean;
    get_width(): number;
    get_height(): number;
    getData(): Datum;
    clone(): Table;
    create(): Table;
    getMeta(): Meta | null;
  }

  export class TableView implements Table {
    data: NativeRows;
    height: number;
    width: number;

    constructor(data: NativeRows);
    constructor(width: number, height: number);

    get_width(): number;
    get_height(): number;
    getCell(x: number, y: number): NativeCell;
    setCell(x: number, y: number, c: NativeCell): void;
    toString(): string;
    getCellView(): CellView;
    isResizable(): boolean;
    resize(w: number, h: number): boolean;
    clear(): void;
    trim(): boolean;
    trimRows(): boolean;
    trimColumns(): boolean;
    insertOrDeleteRows(fate: number[], hfate: number): boolean;
    insertOrDeleteColumns(fate: number[], wfate: number): boolean;
    trimBlank(): boolean;
    getData(): NativeRows;
    clone(): TableView;
    create(): TableView;
    getMeta(): null;
  }

  export class CellView implements View {
    toString(d: Datum): string;
    equals(d1: Datum, d2: Datum): boolean;
    toDatum(d: Datum): Datum;
    makeHash(): Record<string, Datum>;
    hashSet(h: Record<string, Datum>, str: string, d: Datum): void;
    hashGet(h: Record<string, Datum>, str: string): Datum;
    hashExists(h: Record<string, Datum>, str: string): boolean;
    isHash(h: Datum): boolean;
    isTable(t: Datum): boolean;
    getTable(t: Datum): Table;
    wrapTable(t: Table): Datum;
  }

  export class SimpleView extends CellView {}

  export class SimpleTable implements Table {
    readonly height: number;
    readonly width: number;

    constructor(w: number, h: number);

    getTable(): Table;
    get_width(): number;
    get_height(): number;
    getCell(x: number, y: number): Datum;
    setCell(x: number, y: number, c: Datum): void;
    toString(): string;
    getCellView(): SimpleView;
    isResizable(): boolean;
    resize(w: number, h: number): boolean;
    clear(): void;
    insertOrDeleteRows(fate: number[], hfate: number): boolean;
    insertOrDeleteColumns(fate: number[], wfate: number): boolean;
    trimBlank(): boolean;
    getData(): Datum;
    clone(): Table;
    create(): Table;
    setMeta(meta: Meta): void;
    getMeta(): Meta | null;

    static tableToString(tab: Table): string;
    static tableIsSimilar(tab1: Table, tab2: Table): boolean;
  }

  export class CompareFlags {
    ordered: boolean;
    show_unchanged: boolean;
    unchanged_context: number;
    always_show_order: boolean;
    never_show_order: boolean;
    show_unchanged_columns: boolean;
    unchanged_column_context: number;
    always_show_header: boolean;
    acts: HaxeMap<boolean> | null;
    ids: string[] | null;
    columns_to_ignore: string[] | null;
    tables: string[] | null;
    allow_nested_cells: boolean;
    warnings: string[] | null;
    diff_strategy: "hash" | "sql" | string | null;
    padding_strategy: "smart" | "dense" | "sparse" | string | null;
    show_meta: boolean;
    show_unchanged_meta: boolean;
    parent: Table | null;
    count_like_a_spreadsheet: boolean;
    ignore_whitespace: boolean;
    ignore_case: boolean;
    ignore_epsilon: number;
    terminal_format: "plain" | "ansi" | string | null;
    use_glyphs: boolean;
    quote_html: boolean;

    filter(act: "update" | "insert" | "delete" | "column" | string, allow: boolean): boolean;
    allowUpdate(): boolean;
    allowInsert(): boolean;
    allowDelete(): boolean;
    allowColumn(): boolean;
    getIgnoredColumns(): HaxeMap<boolean> | null;
    addPrimaryKey(column: string): void;
    ignoreColumn(column: string): void;
    addTable(table: string): void;
    addWarning(warn: string): void;
    getWarning(): string | null;
    getNameByRole(name: string, role: string): string;
    getCanonicalName(name: string): string;
    getIdsByRole(role: string): string[] | null;
  }

  export class Unit {
    l: number;
    r: number;
    p: number;

    constructor(l?: number, r?: number, p?: number);

    lp(): number;
    toString(): string;
    fromString(txt: string): boolean;
    toBase26String(): string;
  }

  export class Ordering {
    constructor();

    add(l: number, r: number, p?: number): void;
    getList(): Unit[];
    toString(): string;
  }

  export class Alignment {
    reference: Alignment | null;
    meta: Alignment | null;
    comp: TableComparisonState | null;
    has_addition: boolean;
    has_removal: boolean;

    range(ha: number, hb: number): void;
    tables(ta: Table, tb: Table): void;
    headers(ia: number, ib: number): void;
    setRowlike(flag: boolean): void;
    link(a: number, b: number): void;
    addIndexColumns(unit: Unit): void;
    getIndexColumns(): Unit[] | null;
    a2b(a: number): number | null;
    b2a(b: number): number | null;
    count(): number;
    toString(): string;
    toOrder(): Ordering;
    addToOrder(l: number, r: number, p?: number): void;
    getSource(): Table;
    getTarget(): Table;
    getSourceHeader(): number;
    getTargetHeader(): number;
    markIdentical(): void;
    isMarkedAsIdentical(): boolean;
  }

  export class TableComparisonState {
    p: Table | null;
    a: Table | null;
    b: Table | null;
    completed: boolean;
    run_to_completion: boolean;
    compare_flags: CompareFlags | null;
    alignment: Alignment | null;
  }

  export class CompareTable {
    constructor(comp: TableComparisonState);

    run(): boolean;
    align(): Alignment;
    getComparisonState(): TableComparisonState;
    storeIndexes(): void;
    getIndexes(): IndexPair[];
  }

  export class IndexPair {
    constructor(flags: CompareFlags);

    addColumns(ca: number, cb: number): void;
    indexTables(a: Table, b: Table, hdr: number): void;
    getTopFreq(): number;
    getQuality(): number;
  }

  export interface CellBuilder {
    needSeparator(): boolean;
    setSeparator(separator: string): void;
    setConflictSeparator(separator: string): void;
    setView(view: View): void;
    update(local: Datum, remote: Datum): Datum;
    conflict(parent: Datum, local: Datum, remote: Datum): Datum;
    marker(label: string): Datum;
    links(unit: Unit, row_like: boolean): Datum;
  }

  export class FlatCellBuilder implements CellBuilder {
    constructor(flags: CompareFlags);

    needSeparator(): boolean;
    setSeparator(separator: string): void;
    setConflictSeparator(separator: string): void;
    setView(view: View): void;
    update(local: Datum, remote: Datum): Datum;
    conflict(parent: Datum, local: Datum, remote: Datum): Datum;
    marker(label: string): Datum;
    links(unit: Unit, row_like: boolean): Datum;

    static quoteForDiff(v: View, d: Datum): string;
  }

  export class CellInfo {
    raw: Datum;
    value: string;
    pretty_value: string;
    category: string;
    category_given_tr: string;
    separator: string;
    pretty_separator: string;
    updated: boolean;
    conflicted: boolean;
    pvalue: string | null;
    lvalue: string | null;
    rvalue: string | null;
    meta: string | null;

    toString(): string;
  }

  export class DiffSummary {
    row_deletes: number;
    row_inserts: number;
    row_updates: number;
    row_reorders: number;
    col_deletes: number;
    col_inserts: number;
    col_updates: number;
    col_renames: number;
    col_reorders: number;
    row_count_initial_with_header: number;
    row_count_final_with_header: number;
    row_count_initial: number;
    row_count_final: number;
    col_count_initial: number;
    col_count_final: number;
    different: boolean;
  }

  export class TableDiff {
    constructor(align: Alignment, flags: CompareFlags);

    setCellBuilder(builder: CellBuilder): void;
    hilite(output: Table): boolean;
    hiliteWithNesting(output: Tables): boolean;
    hasDifference(): boolean;
    hasSchemaDifference(): boolean;
    isNested(): boolean;
    getComparisonState(): TableComparisonState | null;
    getSummary(): DiffSummary;
  }

  export class Tables {
    alignment: Alignment | null;

    constructor(template: Table);

    add(name: string): Table;
    getOrder(): string[];
    get(name: string): Table;
    one(): Table;
    hasInsDel(): boolean;
  }

  export class DiffRender {
    usePrettyArrows(flag: boolean): void;
    quoteHtml(flag: boolean): void;
    html(): string;
    toString(): string;
    render(tab: Table): DiffRender;
    renderTables(tabs: Tables): DiffRender;
    sampleCss(): string;
    completeHtml(): void;

    static examineCell(
      x: number,
      y: number,
      view: View,
      raw: Datum,
      vcol: string,
      vrow: string,
      vcorner: string,
      cell: CellInfo,
      offset?: number,
    ): void;
  }

  export class TableModifier {
    constructor(t: Table);
    removeColumn(at: number): boolean;
  }

  export class HighlightPatch {
    constructor(source: Table, patch: Table, flags?: CompareFlags);
    apply(): boolean;
    getRowString(c: number): string;
    isPreamble(): boolean;
  }

  export class HighlightPatchUnit {
    add: boolean;
    rem: boolean;
    update: boolean;
    code: string;
    sourceRow: number;
    sourceRowOffset: number;
    sourcePrevRow: number;
    sourceNextRow: number;
    destRow: number;
    patchRow: number;
    toString(): string;
  }

  export class TableIO {
    valid(): boolean;
    getContent(name: string): string;
    saveContent(name: string, txt: string): boolean;
    args(): string[];
    writeStdout(txt: string): void;
    writeStderr(txt: string): void;
    command(cmd: string, args: string[]): number;
    hasAsync(): boolean;
    exists(path: string): boolean;
    isTtyKnown(): boolean;
    isTty(): boolean;
    openSqliteDatabase(path: string): SqlDatabase;
    sendToBrowser(html: string): void;
  }

  export class Coopy {
    static VERSION: string;
    static diffAsHtml(
      local: Table | NativeRows,
      remote: Table | NativeRows,
      flags?: CompareFlags,
    ): string;
    static diffAsAnsi(
      local: Table | NativeRows,
      remote: Table | NativeRows,
      flags?: CompareFlags,
    ): string;
    static diff(local: Table | NativeRows, remote: Table | NativeRows, flags?: CompareFlags): Table;
    static patch(
      local: Table | NativeRows,
      patch: Table | NativeRows,
      flags?: CompareFlags,
    ): boolean;
    static compareTables(
      local: Table | NativeRows,
      remote: Table | NativeRows,
      flags?: CompareFlags,
    ): CompareTable;
    static compareTables3(
      parent: Table | NativeRows,
      local: Table | NativeRows,
      remote: Table | NativeRows,
      flags?: CompareFlags,
    ): CompareTable;

    constructor(io?: TableIO | null);

    loadTable(name: string, role: string): Table;
    run(args: string[], io?: TableIO | null): number;
    coopyhx(io: TableIO): number;
  }

  export class ColumnChange {
    prevName: string | null;
    name: string | null;
    props: PropertyChange[] | null;
  }

  export class PropertyChange {
    prevName: string | null;
    name: string | null;
    val: Datum;
  }

  export class RowChange {
    cond: HaxeMap<Datum> | null;
    val: HaxeMap<Datum> | null;
    conflicting_val: HaxeMap<Datum> | null;
    conflicting_parent_val: HaxeMap<Datum> | null;
    conflicted: boolean;
    is_key: HaxeMap<boolean> | null;
    action: string;

    toString(): string;
  }

  export class SqlColumn {
    name: string;
    primary: boolean;
    type_value: string;
    type_family: string;

    setName(name: string): void;
    setPrimaryKey(primary: boolean): void;
    setType(value: string, family: string): void;
    getName(): string;
    isPrimaryKey(): boolean;
    toString(): string;
  }

  export class SqlTableName {
    name: string;
    prefix: string;

    constructor(name?: string, prefix?: string);

    toString(): string;
  }

  export class Ndjson {
    constructor(tab: Table);

    renderRow(r: number): string;
    render(): string;
    addRow(r: number, txt: string): void;
    addHeaderRow(r: number): void;
    parse(txt: string): void;
  }

  export class Merger {
    constructor(parent: Table, local: Table, remote: Table, flags?: CompareFlags);
    apply(): number;
    getConflictInfos(): ConflictInfo[];
  }

  export class ConflictInfo {
    row: number;
    col: number;
    pvalue: Datum;
    lvalue: Datum;
    rvalue: Datum;

    constructor(row: number, col: number, pvalue: Datum, lvalue: Datum, rvalue: Datum);
  }

  export class Csv {}
  export class Mover {}
  export class Viterbi {}
  export class CombinedTable {}
  export class TerminalDiffRender {}
  export class SimpleMeta implements Meta {
    alterColumns(columns: ColumnChange[]): boolean;
    changeRow(rc: RowChange): boolean;
    applyFlags(flags: CompareFlags): boolean;
    asTable(): Table;
    cloneMeta(table?: Table | null): Meta;
    useForColumnChanges(): boolean;
    useForRowChanges(): boolean;
    getRowStream(): RowStream | null;
    isNested(): boolean;
    isSql(): boolean;
    getName(): string | null;
  }
  export class SqlTable implements Table {
    readonly height: number;
    readonly width: number;
    getCell(x: number, y: number): Datum;
    setCell(x: number, y: number, c: Datum): void;
    getCellView(): View;
    isResizable(): boolean;
    resize(w: number, h: number): boolean;
    clear(): void;
    insertOrDeleteRows(fate: number[], hfate: number): boolean;
    insertOrDeleteColumns(fate: number[], wfate: number): boolean;
    trimBlank(): boolean;
    get_width(): number;
    get_height(): number;
    getData(): Datum;
    clone(): Table;
    create(): Table;
    getMeta(): Meta | null;
  }
  export class SqlTables {}
  export class SqlCompare {}
  export class SqlDatabase {}
  export class SqliteHelper {}
  export class SqliteDatabase {}
  export class NdjsonTable {}

  export const VERSION: string;
  export const coopy: typeof import("daff");

  export function diffAsHtml(
    local: Table | NativeRows,
    remote: Table | NativeRows,
    flags?: CompareFlags,
  ): string;
  export function diffAsAnsi(
    local: Table | NativeRows,
    remote: Table | NativeRows,
    flags?: CompareFlags,
  ): string;
  export function diff(
    local: Table | NativeRows,
    remote: Table | NativeRows,
    flags?: CompareFlags,
  ): Table;
  export function patch(
    local: Table | NativeRows,
    patch: Table | NativeRows,
    flags?: CompareFlags,
  ): boolean;
  export function compareTables(
    local: Table | NativeRows,
    remote: Table | NativeRows,
    flags?: CompareFlags,
  ): CompareTable;
  export function compareTables3(
    parent: Table | NativeRows,
    local: Table | NativeRows,
    remote: Table | NativeRows,
    flags?: CompareFlags,
  ): CompareTable;

  export function align(
    local: Table | NativeRows,
    remote: Table | NativeRows,
    flags?: CompareFlags,
  ): TableDiff;
  export function cellFor(x: number, y: number, table: Table): Datum;
  export function jsonify(table: Table): Datum;
  export function show(table: Table): string;
  export function tablify(table: Table | NativeRows | Datum): Table;
  export function cmd(args: string[]): number;
  export function main(): void;
  export function run_daff_main(): void;

  const daff: typeof import("daff");
  export default daff;
}
