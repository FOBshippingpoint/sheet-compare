import { describe, expect, it } from "vitest";
import { offsetsFor, nearestOffsetIndex, clamp } from "../../src/lib/freezeMath.js";
import { columnMetrics, indexesForRange, rangeNeedsUpdate, visibleRange } from "../../src/lib/virtualTable.js";

describe("freeze math", () => {
  it("calculates boundary offsets and nearest snap indexes", () => {
    const offsets = offsetsFor([20, 30, 40]);

    expect(offsets).toEqual([0, 20, 50, 90]);
    expect(nearestOffsetIndex(offsets, 44)).toBe(2);
    expect(clamp(0, 6, 3)).toBe(3);
  });
});

describe("virtual table math", () => {
  it("includes viewport and overscan indexes", () => {
    expect(visibleRange(240, 120, 24, 100)).toEqual({ start: 0, end: 27 });
  });

  it("keeps frozen indexes with visible indexes", () => {
    expect(indexesForRange({ start: 10, end: 13 }, 2)).toEqual([0, 1, 10, 11, 12]);
  });

  it("calculates column offsets", () => {
    expect(columnMetrics([40, 60, 80])).toEqual({
      widths: [40, 60, 80],
      offsets: [0, 40, 100, 180],
      totalWidth: 180,
    });
  });

  it("updates rendered ranges only near the buffered edge", () => {
    const offsets = [0, 24, 48, 72, 96, 120, 144, 168, 192, 216, 240];
    const range = { start: 0, end: 10 };

    expect(rangeNeedsUpdate(48, 96, range, offsets, 2)).toBe(false);
    expect(rangeNeedsUpdate(0, 96, range, offsets, 2)).toBe(true);
    expect(rangeNeedsUpdate(120, 96, range, offsets, 2)).toBe(true);
  });
});
