import * as XLSX from "xlsx";
import { fileArrayBuffer, fileText, loadTableFile } from "./files.js";

/**
 * @param {unknown[][]} diffRows
 */
export function diffRowsToCsv(diffRows) {
  return XLSX.utils.sheet_to_csv(XLSX.utils.aoa_to_sheet(diffRows), {
    FS: ",",
    RS: "\n",
    blankrows: true,
  });
}

export function downloadBlob(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");

  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function exportStandaloneHtml({ left, right, options }) {
  const [leftData, rightData, assets] = await Promise.all([
    fileState(left),
    fileState(right),
    inlineAssets(),
  ]);

  const state = {
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

export function loadStandaloneState() {
  const element = document.getElementById("table-compare-data");

  if (!element?.textContent) return null;

  const state = JSON.parse(element.textContent);

  return {
    options: state.options,
    left: selectedFromState(state.left, state.sheets.left),
    right: selectedFromState(state.right, state.sheets.right),
  };
}

async function selectedFromState(entry, sheetName) {
  const bytes =
    entry.encoding === "base64" ? base64ToBytes(entry.data) : new TextEncoder().encode(entry.data);
  const file = new File([bytes], entry.name, { type: entry.mime });
  const loaded = await loadTableFile(file);

  return { file: loaded, sheetName };
}

async function fileState(selected) {
  if (selected.file.kind === "csv") {
    return {
      name: selected.file.name,
      mime: selected.file.source.type || "text/csv",
      encoding: "text",
      data: await fileText(selected.file.source),
    };
  }

  return {
    name: selected.file.name,
    mime:
      selected.file.source.type ||
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    encoding: "base64",
    data: bytesToBase64(new Uint8Array(await fileArrayBuffer(selected.file.source))),
  };
}

async function inlineAssets() {
  const styles = await Promise.all(
    [...document.querySelectorAll('link[rel="stylesheet"]')].map(async (link) => {
      const css = await fetch(link.href).then((response) => response.text());
      return `<style>${css}</style>`;
    }),
  );
  const scripts = await Promise.all(
    [...document.querySelectorAll('script[type="module"][src]')].map(async (script) => {
      const js = await fetch(script.src).then((response) => response.text());
      return `<script type="module">${js.replaceAll("</script>", "<\\/script>")}</script>`;
    }),
  );

  return {
    styles: styles.join("\n"),
    scripts: scripts.join("\n"),
  };
}

function bytesToBase64(bytes) {
  let binary = "";

  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary);
}

function base64ToBytes(base64) {
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}
