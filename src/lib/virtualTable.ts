import type { TableRows } from "./types";

export const rowHeight = 24;
export const defaultColumnWidth = 144;
export const maxColumnWidth = 420;
export const minColumnWidth = 48;
export const overscan = 12;
export const rangeGuardRows = 4;
export const rangeGuardColumns = 1;
export const scrollIdleDelay = 120;

/**
 * Render only the viewport plus frozen ranges; never use this to drop data.
 */
export type VisibleRange = {
  start: number;
  end: number;
};

export type ColumnMetrics = {
  widths: number[];
  offsets: number[];
  totalWidth: number;
};

export function visibleRange(
  offset: number,
  viewportSize: number,
  itemSize: number,
  itemCount: number,
): VisibleRange {
  const start = clamp(0, Math.floor(offset / itemSize) - overscan, itemCount);
  const end = clamp(start, Math.ceil((offset + viewportSize) / itemSize) + overscan, itemCount);

  return { start, end };
}

export function columnWidth(rows: TableRows, columnIndex: number, labelColumn = false): number {
  if (labelColumn) return 56;

  let maxLength = 1;
  const limit = Math.min(rows.length, 80);

  for (let rowIndex = 0; rowIndex < limit; rowIndex++) {
    maxLength = Math.max(maxLength, String(rows[rowIndex]?.[columnIndex] ?? "").length);
  }

  return clamp(minColumnWidth, maxLength * 8 + 24, maxColumnWidth);
}

export function columnMetrics(widths: number[]): ColumnMetrics {
  const offsets = [0];

  for (const width of widths) offsets.push(offsets[offsets.length - 1] + width);

  return {
    widths,
    offsets,
    totalWidth: offsets[offsets.length - 1] ?? 0,
  };
}

export function indexesForRange(range: VisibleRange, frozenCount: number): number[] {
  const indexes = new Set<number>();

  for (let index = 0; index < frozenCount; index++) indexes.add(index);
  for (let index = range.start; index < range.end; index++) indexes.add(index);

  return [...indexes].sort((left, right) => left - right);
}

/**
 * Keep scroll-time rendering calm by treating the rendered window as a cache.
 * A new window is only needed when the viewport approaches the cache edge;
 * otherwise the scroll container can move already-rendered cells by itself.
 */
export function rangeNeedsUpdate(
  offset: number,
  viewportSize: number,
  range: VisibleRange,
  offsets: number[],
  guardItems: number,
): boolean {
  const lastOffsetIndex = offsets.length - 1;
  const startGuard = offsets[clamp(0, range.start + guardItems, lastOffsetIndex)] ?? 0;
  const endGuard = offsets[clamp(0, range.end - guardItems, lastOffsetIndex)] ?? startGuard;

  return offset < startGuard || offset + viewportSize > endGuard;
}

function clamp(min: number, value: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
