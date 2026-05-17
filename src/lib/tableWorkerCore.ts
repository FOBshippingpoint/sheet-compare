import { loadTableFile } from "./files";
import { runDiffRows } from "./diff";
import type { TableWorkerDataResponse, TableWorkerRequest } from "../types/workerProtocol";

export async function handleTableWorkerMessage(
  message: TableWorkerRequest,
): Promise<TableWorkerDataResponse> {
  switch (message.type) {
    case "parse-file":
      return handleParseFile(message);
    case "compare-rows":
      return handleCompareRows(message);
    default:
      throw new Error("Unknown worker message.");
  }
}

async function handleParseFile(
  message: TableWorkerRequest<"parse-file">,
): Promise<TableWorkerDataResponse<"parse-file">> {
  return {
    type: "parse-file",
    requestId: message.requestId,
    side: message.side,
    file: await loadTableFile(message.file, message.sheetName),
  };
}

async function handleCompareRows(
  message: TableWorkerRequest<"compare-rows">,
): Promise<TableWorkerDataResponse<"compare-rows">> {
  const result = runDiffRows(message.leftRows, message.rightRows, message.options);

  return {
    type: "compare-rows",
    requestId: message.requestId,
    result: {
      diffRows: result.diffRows.map((row) => row.map((cell) => cell?.toString() ?? "")),
      summary: { ...result.summary },
    },
  };
}
