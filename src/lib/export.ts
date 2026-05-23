import * as XLSX from "xlsx";
import { fileArrayBuffer, fileText, loadTableFile } from "./files";
import type { SupportedLocale } from "./i18n/locale";
import type { CompareOptions, SelectedTableFile, TableRows } from "./types";

type Encoding = "text" | "base64";

type StandaloneFileState = {
  name: string;
  mime: string;
  encoding: Encoding;
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
  locale?: SupportedLocale;
};

export type LoadedStandaloneState = {
  options: CompareOptions;
  locale?: SupportedLocale;
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
  locale,
}: {
  left: SelectedTableFile;
  right: SelectedTableFile;
  options: CompareOptions;
  locale: SupportedLocale;
}): Promise<string> {
  const [leftData, rightData] = await Promise.all([fileState(left), fileState(right)]);
  const state: StandaloneDocumentState = {
    version: 1,
    left: leftData,
    right: rightData,
    sheets: {
      left: left.sheetName,
      right: right.sheetName,
    },
    options,
    locale,
  };
  const html = document.implementation.createHTMLDocument();

  html.documentElement.lang = locale;
  html.body.replaceChildren(appMount(html), standaloneData(html, state));
  await inlineAssets(html);

  return `<!doctype html>\n${html.documentElement.outerHTML}`;
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
    locale: state.locale,
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

async function inlineAssets(html: Document): Promise<void> {
  const styles = await Promise.all(
    [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].map(async (link) => {
      const style = html.createElement("style");

      style.textContent = await fetch(link.href).then((response) => response.text());
      return style;
    }),
  );
  const scripts = await Promise.all(
    [...document.querySelectorAll<HTMLScriptElement>('script[type="module"][src]')].map(
      async (script) => {
        const inlineScript = html.createElement("script");

        inlineScript.type = "module";
        inlineScript.textContent = escapeScriptText(
          await fetch(script.src).then((response) => response.text()),
        );
        return inlineScript;
      },
    ),
  );

  html.head.append(...styles);
  html.body.append(...scripts);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

function appMount(html: Document): HTMLDivElement {
  const element = html.createElement("div");

  element.id = "app";
  return element;
}

function standaloneData(html: Document, state: StandaloneDocumentState): HTMLScriptElement {
  const element = html.createElement("script");

  element.id = "table-compare-data";
  element.type = "application/json";
  element.textContent = escapeScriptText(JSON.stringify(state));
  return element;
}

function escapeScriptText(value: string): string {
  return value.replaceAll("</script>", "<\\/script>");
}
