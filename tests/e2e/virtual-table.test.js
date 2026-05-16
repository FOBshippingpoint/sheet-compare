import { expect, test } from "vitest";
import { page, userEvent } from "vitest/browser";
import { mountApp } from "./helpers.js";

test("preview table shows spreadsheet labels and freeze controls", async () => {
  mountApp();

  await page.getByLabelText("Sample").selectOptions("registration-xlsx");
  await expect
    .element(page.getByText("sample-registration-left.xlsx", { exact: false }))
    .toBeInTheDocument();

  const leftPreview = page.getByRole("heading", { name: "Left" }).element().closest(".preview");
  const handle = leftPreview.querySelector('button[aria-label^="Adjust frozen rows and columns"]');

  expect(handle.getAttribute("aria-label")).toContain("Frozen rows 1, frozen columns 1");
  expect(leftPreview.textContent).toContain("A");
  expect(leftPreview.textContent).toContain("1");
});

test("diff table keeps frozen cells while scrolling", async () => {
  mountApp();

  await page.getByLabelText("Sample").selectOptions("exam-csv");
  await expect.element(page.getByLabelText("Diff table")).toBeInTheDocument();

  const diffPane = page.getByLabelText("Diff table").element();
  const handle = page
    .getByLabelText("Diff table")
    .getByRole("button", { name: /Adjust frozen rows and columns/ })
    .element();

  handle.focus();
  await userEvent.keyboard("{ArrowRight}{ArrowDown}");
  expect(handle.getAttribute("aria-label")).toContain("Frozen rows 3, frozen columns 3");

  await userEvent.keyboard("{Home}");
  expect(handle.getAttribute("aria-label")).toContain("Frozen rows 0, frozen columns 0");

  await userEvent.keyboard("{ArrowRight}{ArrowRight}");

  const scrollport = page.getByLabelText("Diff data table").element();
  const actionCell = diffPane.querySelector(".action-cell");
  const leftBeforeScroll = actionCell.getBoundingClientRect().left;

  scrollport.scrollLeft = 160;
  scrollport.dispatchEvent(new Event("scroll"));

  expect(Math.round(actionCell.getBoundingClientRect().left)).toBe(Math.round(leftBeforeScroll));
});

test("large previews render a bounded cell set while scrolling", async () => {
  mountApp();

  await page.getByLabelText("Sample").selectOptions("registration-xlsx");
  await expect.element(page.getByRole("heading", { name: "Left" })).toBeInTheDocument();
  await expect.element(page.getByLabelText("Sheet preview table").first()).toBeInTheDocument();

  const previewScrollport = page
    .getByRole("heading", { name: "Left" })
    .element()
    .closest(".preview")
    .querySelector('[aria-label="Sheet preview table"]');

  const beforeCount = previewScrollport.querySelectorAll('[role="cell"]').length;

  previewScrollport.scrollTop = previewScrollport.scrollHeight;
  previewScrollport.dispatchEvent(new Event("scroll"));
  await new Promise((resolve) => requestAnimationFrame(resolve));

  expect(previewScrollport.textContent).toContain("60");
  expect(previewScrollport.querySelectorAll('[role="cell"]').length).toBeLessThanOrEqual(
    beforeCount + 20,
  );
});

test("long CSV headers scroll inside preview and diff panes", async () => {
  mountApp();

  await page
    .getByLabelText("Left Sheet File selector")
    .upload("tests/fixtures/long-header-left.csv");
  await page
    .getByLabelText("Right Sheet File selector")
    .upload("tests/fixtures/long-header-right.csv");

  await expect.element(page.getByRole("heading", { name: "Left" })).toBeInTheDocument();
  await expect.element(page.getByLabelText("Diff data table")).toBeInTheDocument();

  const previewScrollport = page
    .getByRole("heading", { name: "Left" })
    .element()
    .closest(".preview")
    .querySelector('[aria-label="Sheet preview table"]');
  const diffScrollport = page.getByLabelText("Diff data table").element();

  expect(previewScrollport.scrollWidth).toBeGreaterThan(previewScrollport.clientWidth);
  expect(diffScrollport.scrollWidth).toBeGreaterThan(diffScrollport.clientWidth);

  previewScrollport.scrollLeft = previewScrollport.scrollWidth;
  diffScrollport.scrollLeft = diffScrollport.scrollWidth;
  previewScrollport.dispatchEvent(new Event("scroll"));
  diffScrollport.dispatchEvent(new Event("scroll"));
  await new Promise((resolve) => setTimeout(resolve));

  expect(previewScrollport.scrollLeft).toBeGreaterThan(0);
  expect(diffScrollport.scrollLeft).toBeGreaterThan(0);
});
