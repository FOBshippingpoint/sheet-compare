import { loadTableFile } from "./files.js";
import { runDiffRows } from "./diff.js";

export async function handleTableWorkerMessage(message) {
  if (message.type === "parse-file") {
    return {
      type: "parse-file",
      requestId: message.requestId,
      side: message.side,
      file: await loadTableFile(message.file, message.sheetName),
    };
  }

  if (message.type === "compare-rows") {
    const result = runDiffRows(message.leftRows, message.rightRows, message.options);

    return {
      type: "compare-rows",
      requestId: message.requestId,
      result: {
        diffRows: result.diffRows.map((row) =>
          row.map((cell) => (cell == null ? "" : String(cell))),
        ),
        summary: { ...result.summary },
      },
    };
  }

  throw new Error(`Unknown worker message: ${message.type}`);
}
