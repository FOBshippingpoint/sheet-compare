import { expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { mountApp } from "./helpers.js";

test("compares uploaded CSV files", async () => {
  mountApp();

  await page.getByLabelText("Left Sheet File selector").upload("tests/fixtures/left.csv");
  await expect.element(page.getByText("left.csv", { exact: false })).toBeInTheDocument();

  await page.getByLabelText("Right Sheet File selector").upload("tests/fixtures/right.csv");

  await expect.element(page.getByRole("heading", { name: "Left" })).toBeInTheDocument();
  await expect.element(page.getByRole("heading", { name: "Right" })).toBeInTheDocument();
  await expect.element(page.getByLabelText("Compare results")).toBeInTheDocument();
  await expect.element(page.getByLabelText("Diff summary")).toHaveTextContent("row");
  await expect.element(page.getByLabelText("Diff table")).toHaveTextContent("+++");
  await expect.element(page.getByRole("button", { name: "Download" }).first()).toBeEnabled();
  await expect.element(page.getByRole("button", { name: "Export CSV" })).toBeEnabled();
  await expect.element(page.getByRole("button", { name: "Export HTML" })).toBeEnabled();
});

test("shows an empty result for matching files", async () => {
  mountApp();

  await page.getByLabelText("Left Sheet File selector").upload("tests/fixtures/left.csv");
  await page.getByLabelText("Right Sheet File selector").upload("tests/fixtures/left.csv");

  await expect.element(page.getByLabelText("Diff table")).toHaveTextContent("No changes found");
});

test("confirms before returning to file selection", async () => {
  const confirmSpy = vi.spyOn(window, "confirm");

  mountApp();

  await page.getByLabelText("Left Sheet File selector").upload("tests/fixtures/left.csv");
  await page.getByLabelText("Right Sheet File selector").upload("tests/fixtures/right.csv");

  confirmSpy.mockReturnValue(false);
  await page.getByRole("link", { name: "Sheet Compare" }).click();

  await expect.element(page.getByLabelText("Diff table")).toBeInTheDocument();

  confirmSpy.mockReturnValue(true);
  await page.getByRole("link", { name: "Sheet Compare" }).click();

  await expect.element(page.getByLabelText("Choose files")).toBeInTheDocument();

  expect(confirmSpy).toHaveBeenCalled();
});
