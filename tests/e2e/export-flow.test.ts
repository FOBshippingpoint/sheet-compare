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

test("exported standalone HTML renders the comparison", async () => {
  const exportResult: { html?: Blob } = {};
  vi.spyOn(URL, "createObjectURL").mockImplementation((content) => {
    exportResult.html = content as Blob;
    return "blob:sheet-compare";
  });
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

  mountApp();

  await page.getByLabelText("Left Sheet File selector").upload("tests/fixtures/left.csv");
  await page.getByLabelText("Right Sheet File selector").upload("tests/fixtures/right.csv");
  await expect.element(page.getByLabelText("Diff table")).toHaveTextContent("+++");
  await expect.element(page.getByRole("button", { name: "Export HTML" })).toBeEnabled();

  await page.getByRole("button", { name: "Export HTML" }).click();

  await vi.waitFor(() => {
    expect(exportResult.html).toBeInstanceOf(Blob);
  });

  const exportedHtml = exportResult.html;

  if (!exportedHtml) throw new Error("Expected Export HTML to create a blob.");

  const frame = document.createElement("iframe");
  const frameErrors: string[] = [];
  const loaded = new Promise<void>((resolve) => frame.addEventListener("load", () => resolve()));

  document.body.append(frame);
  frame.contentWindow?.addEventListener("error", (event) => {
    frameErrors.push(event.message);
  });
  frame.contentWindow?.addEventListener("unhandledrejection", (event) => {
    frameErrors.push(String(event.reason));
  });
  frame.srcdoc = await exportedHtml.text();
  await loaded;

  await vi.waitFor(() => {
    const diffTable = frame.contentDocument?.querySelector('[aria-label="Diff table"]');
    const content =
      frameErrors.join("\n") || frame.contentDocument?.body.textContent?.slice(0, 2000);

    expect(diffTable, content).not.toBeNull();
  });
});
