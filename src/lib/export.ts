import * as XLSX from "xlsx";
import { fileArrayBuffer, fileText, loadTableFile } from "./files";
import type { CompareOptions, SelectedTableFile, TableRows } from "./types";

type StandaloneFileState =
  | {
      name: string;
      mime: string;
      encoding: "text";
      data: string;
    }
  | {
      name: string;
      mime: string;
      encoding: "base64";
      data: string;
    };

type StandaloneDocumentState = {
  version: 1;
  left: StandaloneFileState;
  right: StandaloneFileState;
  sheets: {
    left: string;
    right: string;
  };
  options: CompareOptions;
};

export type LoadedStandaloneState = {
  options: CompareOptions;
  left: Promise<SelectedTableFile>;
  right: Promise<SelectedTableFile>;
};

export function diffRowsToCsv(diffRows: TableRows): string {
  return XLSX.utils.sheet_to_csv(XLSX.utils.aoa_to_sheet(diffRows), {
    FS: ",",
    RS: "\n",
    blankrows: true,
  });
}

export function downloadBlob(name: string, content: BlobPart, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");

  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function exportStandaloneHtml({
  left,
  right,
  options,
}: {
  left: SelectedTableFile;
  right: SelectedTableFile;
  options: CompareOptions;
}): Promise<string> {
  const [leftData, rightData, assets] = await Promise.all([
    fileState(left),
    fileState(right),
    inlineAssets(),
  ]);

  const state: StandaloneDocumentState = {
    version: 1,
    left: leftData,
    right: rightData,
    sheets: {
      left: left.sheetName,
      right: right.sheetName,
    },
    options,
  };

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sheet Compare</title>
    ${assets.styles}
    <script id="table-compare-data" type="application/json">${JSON.stringify(state)}</script>
  </head>
  <body>
    <div id="app"></div>
    ${assets.scripts}
  </body>
</html>`;
}

/**
 * Standalone reports store source files and choices only; do not record rendered
 * diff rows, summary chips, or HTML because they must be regenerated on load.
 */
export function loadStandaloneState(): LoadedStandaloneState | null {
  const element = document.getElementById("table-compare-data");

  if (!element?.textContent) return null;

  const state = JSON.parse(element.textContent) as StandaloneDocumentState;

  return {
    options: state.options,
    left: selectedFromState(state.left, state.sheets.left),
    right: selectedFromState(state.right, state.sheets.right),
  };
}

async function selectedFromState(
  entry: StandaloneFileState,
  sheetName: string,
): Promise<SelectedTableFile> {
  const bytes: Uint8Array<ArrayBuffer> =
    entry.encoding === "base64" ? base64ToBytes(entry.data) : new TextEncoder().encode(entry.data);
  const file = new File([new Blob([bytes])], entry.name, { type: entry.mime });
  return loadTableFile(file, sheetName);
}

async function fileState(selected: SelectedTableFile): Promise<StandaloneFileState> {
  if (selected.kind === "csv") {
    return {
      name: selected.name,
      mime: selected.source.type || "text/csv",
      encoding: "text",
      data: await fileText(selected.source),
    };
  }

  return {
    name: selected.name,
    mime:
      selected.source.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    encoding: "base64",
    data: bytesToBase64(new Uint8Array(await fileArrayBuffer(selected.source))),
  };
}

async function inlineAssets(): Promise<{ styles: string; scripts: string }> {
  const styles = await Promise.all(
    [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].map(async (link) => {
      const css = await fetch(link.href).then((response) => response.text());
      return `<style>${css}</style>`;
    }),
  );
  const scripts = await Promise.all(
    [...document.querySelectorAll<HTMLScriptElement>('script[type="module"][src]')].map(
      async (script) => {
        const js = await fetch(script.src).then((response) => response.text());
        return `<script type="module">${js.replaceAll("</script>", "<\\/script>")}</script>`;
      },
    ),
  );

  return {
    styles: styles.join("\n"),
    scripts: scripts.join("\n"),
  };
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}
