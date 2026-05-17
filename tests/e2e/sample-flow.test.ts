import { expect, test } from "vitest";
import { page } from "vitest/browser";
import { mountApp } from "./helpers";

test("loads built-in sample comparisons", async () => {
  mountApp();

  await page.getByLabelText("Sample").selectOptions("exam-csv");
  expect(page.getByLabelText("Sample").element()).toHaveProperty("value", "exam-csv");

  await expect
    .element(page.getByText("sample-exam-left.csv", { exact: false }))
    .toBeInTheDocument();
  await expect.element(page.getByLabelText("Diff summary")).toHaveTextContent("row");
  await expect.element(page.getByLabelText("Diff table")).toHaveTextContent("+++");

  await page.getByLabelText("Sample").selectOptions("registration-xlsx");
  expect(page.getByLabelText("Sample").element()).toHaveProperty("value", "registration-xlsx");

  await expect
    .element(page.getByText("sample-registration-left.xlsx", { exact: false }))
    .toBeInTheDocument();
  await expect
    .element(page.getByLabelText("Left").getByRole("cell", { name: "A" }).first())
    .toBeInTheDocument();
  await expect
    .element(page.getByLabelText("Left").getByRole("cell", { name: "1" }).first())
    .toBeInTheDocument();
  await expect
    .element(page.getByLabelText("Left").getByRole("cell", { name: "Registration Result" }).first())
    .toBeInTheDocument();
  await expect.element(page.getByLabelText("Diff table")).toHaveTextContent("@:@");
  await expect.element(page.getByLabelText("Diff table")).toHaveTextContent("A:A");
  await expect.element(page.getByLabelText("Diff summary")).toHaveTextContent("row");
});
