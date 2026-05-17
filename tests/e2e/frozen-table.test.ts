import { expect, test } from "vitest";
import { page, userEvent } from "vitest/browser";
import FrozenTableHarness from "./FrozenTableHarness.svelte";
import { mountComponent, requireElement } from "./helpers";

test("frozen header remains mounted and positioned during vertical scroll", async () => {
  mountComponent(FrozenTableHarness);

  await expect.element(page.getByLabelText("Standalone frozen table")).toBeInTheDocument();

  const scrollport = page.getByLabelText("Standalone frozen table").element();
  const headerCell = cell(scrollport, 0, 1);
  const initialTop = Math.round(headerCell.getBoundingClientRect().top);
  const removedHeaderCells: HTMLElement[] = [];
  const observer = watchRemovedHeaderCells(scrollport, removedHeaderCells);

  for (let step = 1; step <= 20; step++) {
    scrollport.scrollTop = step * 36;
    scrollport.dispatchEvent(new Event("scroll"));
    await nextFrame();

    const currentHeaderCell = cell(scrollport, 0, 1);
    expect(currentHeaderCell).toBe(headerCell);
    expect(Math.round(currentHeaderCell.getBoundingClientRect().top)).toBe(initialTop);
  }

  observer.disconnect();
  expect(removedHeaderCells).toHaveLength(0);
});

test("frozen header does not drift during smooth vertical scroll", async () => {
  mountComponent(FrozenTableHarness);

  await expect.element(page.getByLabelText("Standalone frozen table")).toBeInTheDocument();

  const scrollport = page.getByLabelText("Standalone frozen table").element();
  const headerCell = cell(scrollport, 0, 1);
  const initialTop = headerCell.getBoundingClientRect().top;
  const samples: number[] = [];

  scrollport.scrollTo({ top: 720, behavior: "smooth" });

  for (let frame = 0; frame < 20; frame++) {
    await nextFrame();
    samples.push(headerCell.getBoundingClientRect().top - initialTop);
  }

  const maxDrift = Math.max(...samples.map((sample) => Math.abs(sample)));
  expect(maxDrift).toBeLessThanOrEqual(1);
});

test("frozen header does not drift during wheel vertical scroll", async () => {
  mountComponent(FrozenTableHarness);

  await expect.element(page.getByLabelText("Standalone frozen table")).toBeInTheDocument();

  const scrollport = page.getByLabelText("Standalone frozen table").element();
  const headerCell = cell(scrollport, 0, 1);
  const initialTop = headerCell.getBoundingClientRect().top;
  const samples = samplePlacement(() => headerCell.getBoundingClientRect().top - initialTop, 30);

  await userEvent.wheel(scrollport, { delta: { y: 120 }, times: 12 });

  const maxDrift = Math.max(...(await samples).map((sample) => Math.abs(sample)));
  expect(maxDrift).toBeLessThanOrEqual(1);
});

test("frozen column does not drift during smooth horizontal scroll", async () => {
  mountComponent(FrozenTableHarness);

  await expect.element(page.getByLabelText("Standalone frozen table")).toBeInTheDocument();

  const scrollport = page.getByLabelText("Standalone frozen table").element();
  const columnCell = cell(scrollport, 1, 0);
  const initialLeft = columnCell.getBoundingClientRect().left;
  const samples: number[] = [];

  scrollport.scrollTo({ left: 1280, behavior: "smooth" });

  for (let frame = 0; frame < 20; frame++) {
    await nextFrame();
    samples.push(columnCell.getBoundingClientRect().left - initialLeft);
  }

  const maxDrift = Math.max(...samples.map((sample) => Math.abs(sample)));
  expect(maxDrift).toBeLessThanOrEqual(1);
});

test("frozen column does not drift during wheel horizontal scroll", async () => {
  mountComponent(FrozenTableHarness);

  await expect.element(page.getByLabelText("Standalone frozen table")).toBeInTheDocument();

  const scrollport = page.getByLabelText("Standalone frozen table").element();
  const columnCell = cell(scrollport, 1, 0);
  const initialLeft = columnCell.getBoundingClientRect().left;
  const samples = samplePlacement(() => columnCell.getBoundingClientRect().left - initialLeft, 30);

  await userEvent.wheel(scrollport, { delta: { x: 160 }, times: 12 });

  const maxDrift = Math.max(...(await samples).map((sample) => Math.abs(sample)));
  expect(maxDrift).toBeLessThanOrEqual(1);
});

test("frozen corner remains mounted and positioned during horizontal scroll", async () => {
  mountComponent(FrozenTableHarness);

  await expect.element(page.getByLabelText("Standalone frozen table")).toBeInTheDocument();

  const scrollport = page.getByLabelText("Standalone frozen table").element();
  const cornerCell = cell(scrollport, 0, 0);
  const initialRect = cornerCell.getBoundingClientRect();
  const removedHeaderCells: HTMLElement[] = [];
  const observer = watchRemovedHeaderCells(scrollport, removedHeaderCells);

  for (let step = 1; step <= 20; step++) {
    scrollport.scrollLeft = step * 64;
    scrollport.dispatchEvent(new Event("scroll"));
    await nextFrame();

    const currentCornerCell = cell(scrollport, 0, 0);
    const currentRect = currentCornerCell.getBoundingClientRect();

    expect(currentCornerCell).toBe(cornerCell);
    expect(Math.round(currentRect.top)).toBe(Math.round(initialRect.top));
    expect(Math.round(currentRect.left)).toBe(Math.round(initialRect.left));
  }

  observer.disconnect();
  expect(removedHeaderCells.filter((cell) => cell.dataset.columnIndex === "0")).toHaveLength(0);
});

test("multiple frozen rows and columns stay rectangular", async () => {
  mountComponent(FrozenTableHarness, { initialFrozenRows: 3, initialFrozenCols: 3 });

  await expect.element(page.getByLabelText("Standalone frozen table")).toBeInTheDocument();

  const scrollport = page.getByLabelText("Standalone frozen table").element();

  scrollport.scrollTop = 360;
  scrollport.scrollLeft = 640;
  scrollport.dispatchEvent(new Event("scroll"));
  await nextFrame();

  for (let rowIndex = 0; rowIndex < 3; rowIndex++) {
    const tops = [0, 1, 2, 3].map((columnIndex) =>
      Math.round(cell(scrollport, rowIndex, columnIndex).getBoundingClientRect().top),
    );

    expect(new Set(tops).size).toBe(1);
  }

  for (let columnIndex = 0; columnIndex < 3; columnIndex++) {
    const lefts = [0, 1, 2, 3].map((rowIndex) =>
      Math.round(cell(scrollport, rowIndex, columnIndex).getBoundingClientRect().left),
    );

    expect(new Set(lefts).size).toBe(1);
  }
});

function watchRemovedHeaderCells(scrollport: Element, removedHeaderCells: HTMLElement[]) {
  const canvas = requireElement(scrollport.querySelector(".virtual-canvas"));
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.removedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        if (node.matches('[data-row-index="0"]')) removedHeaderCells.push(node);
      }
    }
  });

  observer.observe(canvas, { childList: true });
  return observer;
}

function nextFrame(): Promise<number> {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

function cell(scrollport: Element, rowIndex: number, columnIndex: number): HTMLElement {
  return requireElement(
    scrollport.querySelector<HTMLElement>(
      `[data-row-index="${rowIndex}"][data-column-index="${columnIndex}"]`,
    ),
  );
}

async function samplePlacement(read: () => number, count: number): Promise<number[]> {
  const samples: number[] = [];

  for (let frame = 0; frame < count; frame++) {
    await nextFrame();
    samples.push(read());
  }

  return samples;
}
