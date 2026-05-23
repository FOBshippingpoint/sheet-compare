import * as XLSX from "xlsx";
import { loadTableFile } from "./files";
import type { SupportedLocale } from "./i18n/locale";
import type { CompareOptions, SelectedTableFile, TableRows } from "./types";

type StandaloneFileState = {
  name: string;
  mime: string;
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
  const file = new File([await urlToBlob(entry.data)], entry.name, { type: entry.mime });

  return loadTableFile(file, sheetName);
}

async function fileState(selected: SelectedTableFile): Promise<StandaloneFileState> {
  return {
    name: selected.name,
    mime:
      selected.source.type ||
      (selected.kind === "csv"
        ? "text/csv"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
    data: await blobToDataUrl(selected.source),
  };
}

async function inlineAssets(html: Document): Promise<void> {
  html.head.append(...(await inlineIcons(html)));
  html.head.append(...(await inlineStyles(html)));
  html.body.append(...(await inlineScripts(html)));
}

async function inlineIcons(html: Document): Promise<HTMLLinkElement[]> {
  return Promise.all(
    [...document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"][href]')].map(async (link) => {
      const icon = html.createElement("link");

      icon.rel = link.rel;
      icon.type = link.type;
      icon.href = await anyUrlToDataUrl(link.href);
      return icon;
    }),
  );
}

async function inlineStyles(html: Document): Promise<HTMLStyleElement[]> {
  return [
    ...[...document.querySelectorAll<HTMLStyleElement>("style")].map((style) => {
      const inlineStyle = html.createElement("style");

      inlineStyle.textContent = style.textContent;
      return inlineStyle;
    }),
    ...(await Promise.all(
    [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].map(async (link) => {
      const style = html.createElement("style");

      style.textContent = await fetch(link.href).then((response) => response.text());
      return style;
    }),
    )),
  ];
}

async function inlineScripts(html: Document): Promise<HTMLScriptElement[]> {
  return Promise.all(
    [
      ...document.querySelectorAll<HTMLScriptElement>(
        "script[data-standalone-entry], script[type='module']",
      ),
    ].map(async (script) => {
      const inlineScript = html.createElement("script");

      inlineScript.type = "module";
      inlineScript.textContent = escapeScriptText(
        script.src ? await fetch(script.src).then((response) => response.text()) : script.textContent,
      );
      return inlineScript;
    }),
  );
}

export async function anyUrlToDataUrl(url: string): Promise<string> {
  return blobToDataUrl(await urlToBlob(url));
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  const reader = new FileReader();

  return new Promise((resolve) => {
    reader.addEventListener("load", () => {
      resolve(reader.result as string);
    });
    reader.readAsDataURL(blob);
  });
}

export async function urlToBlob(url: string): Promise<Blob> {
  return fetch(url).then((response) => response.blob());
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
