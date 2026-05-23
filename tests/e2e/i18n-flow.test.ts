import { expect, test } from "vitest";
import { page } from "vitest/browser";
import { mountApp } from "./helpers";

test("switches UI language without clearing the current comparison", async () => {
  mountApp();

  await page.getByLabelText("Left Sheet File selector").upload("tests/fixtures/left.csv");
  await page.getByLabelText("Right Sheet File selector").upload("tests/fixtures/right.csv");
  await expect.element(page.getByLabelText("Diff table")).toHaveTextContent("+++");

  await page.getByLabelText("Language").selectOptions("zh-TW");

  await expect.element(page.getByLabelText("差異表")).toHaveTextContent("+++");
  await expect.element(page.getByText("left.csv", { exact: false })).toBeInTheDocument();
});
