import { describe, expect, it } from "vitest";
import { diffRowsToCsv, exportStandaloneHtml } from "../../src/lib/export";
import type { CompareOptions, SelectedTableFile } from "../../src/lib/types";

function selectedCsv(name: string, content: string): SelectedTableFile {
  const source = new File([content], name, { type: "text/csv;charset=utf-8" });

  return {
    name,
    size: source.size,
    kind: "csv",
    source,
    sheets: [{ name: "Sheet1", rowCount: 2, columnCount: 1 }],
    sheetName: "Sheet1",
    rows: [["id"], [content.at(-1) ?? ""]],
  };
}

describe("diffRowsToCsv", () => {
  it("preserves the daff action column", () => {
    expect(
      diffRowsToCsv([
        ["@@", "id"],
        ["+++", "1"],
      ]),
    ).toBe("@@,id\n+++,1");
  });
});

describe("exportStandaloneHtml", () => {
  const options: CompareOptions = {
    show_unchanged: false,
    show_unchanged_columns: false,
    ignore_whitespace: false,
    ignore_case: false,
    show_order: true,
  };

  it("serializes a standalone document from DOM nodes", async () => {
    document.head.innerHTML = '<link rel="stylesheet" href="data:text/css,.app{}">';
    document.body.innerHTML =
      '<script src="data:text/javascript,ignored"></script>' +
      '<script type="module" src="data:text/javascript,export{}"></script>';

    const html = await exportStandaloneHtml({
      left: selectedCsv("left.csv", "id\n1"),
      right: selectedCsv("right.csv", "id\n2"),
      options,
      locale: "zh-TW",
    });
    const exported = new DOMParser().parseFromString(html, "text/html");

    expect(exported.documentElement.lang).toBe("zh-TW");
    expect(exported.getElementById("app")).not.toBeNull();
    expect(exported.querySelector("style")).toBeTruthy();
    expect(exported.querySelector('script[type="module"]')?.textContent).toBe("export{}");

    const state = JSON.parse(exported.getElementById("table-compare-data")?.textContent ?? "") as {
      locale: string;
      left: { name: string };
      right: { name: string };
    };

    expect(state.locale).toBe("zh-TW");
    expect(state.left.name).toBe("left.csv");
    expect(state.right.name).toBe("right.csv");
  });

  it("serializes an already-inline standalone document", async () => {
    document.head.innerHTML = "<style>.app{color:red}</style>";
    document.body.innerHTML = '<script type="module">export const app = true;</script>';

    const html = await exportStandaloneHtml({
      left: selectedCsv("left.csv", "id\n1"),
      right: selectedCsv("right.csv", "id\n2"),
      options,
      locale: "en",
    });
    const exported = new DOMParser().parseFromString(html, "text/html");

    expect(exported.querySelector("style")?.textContent).toBe(".app{color:red}");
    expect(exported.querySelector('script[type="module"]')?.textContent).toBe(
      "export const app = true;",
    );
  });
});
