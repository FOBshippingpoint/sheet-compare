import { afterEach, expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { mount, unmount } from "svelte";
import "../../src/app.css";
import App from "../../src/App.svelte";

let app;

afterEach(() => {
  if (app) unmount(app);
  document.body.replaceChildren();
});

test("compares CSV files through the upload flow", async () => {
  app = mount(App, { target: document.body });

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

test("show no changes found when left/right files are the same", async () => {
  app = mount(App, { target: document.body });

  await page.getByLabelText("Left Sheet File selector").upload("tests/fixtures/left.csv");
  await page.getByLabelText("Right Sheet File selector").upload("tests/fixtures/left.csv");

  await expect.element(page.getByLabelText("Diff table")).toHaveTextContent("No changes found");
});

test("loads built-in samples from the sample dropdown", async () => {
  app = mount(App, { target: document.body });

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
    .element(page.getByLabelText("Left").getByRole("cell", { name: "Registration Result" }))
    .toBeInTheDocument();
  await expect.element(page.getByLabelText("Diff summary")).toHaveTextContent("row");
});

test("title link confirms before discarding uploaded files", async () => {
  const confirmSpy = vi.spyOn(window, "confirm");

  app = mount(App, { target: document.body });

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
