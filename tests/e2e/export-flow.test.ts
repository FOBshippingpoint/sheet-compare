import { expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { mountApp } from "./helpers";

test("export actions are available after comparison", async () => {
  const createUrl = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:sheet-compare");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

  mountApp();

  await page.getByLabelText("Left Sheet File selector").upload("tests/fixtures/left.csv");
  await page.getByLabelText("Right Sheet File selector").upload("tests/fixtures/right.csv");

  await page.getByRole("button", { name: "Export CSV" }).click();

  expect(createUrl).toHaveBeenCalled();
  await expect.element(page.getByRole("button", { name: "Export HTML" })).toBeEnabled();
});
