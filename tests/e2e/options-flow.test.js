import { expect, test } from "vitest";
import { page } from "vitest/browser";
import { mountApp } from "./helpers.js";

test("updates the diff when 'Show order' option changes", async () => {
  mountApp();

  await page.getByLabelText("Sample").selectOptions("registration-xlsx");
  await expect.element(page.getByLabelText("Diff table")).toHaveTextContent("@:@");

  await page.getByLabelText("Show order").click();

  await expect.element(page.getByLabelText("Diff table")).not.toHaveTextContent("@:@");

  await page.getByLabelText("Show order").click();

  await expect.element(page.getByLabelText("Diff table")).toHaveTextContent("@:@");
});
