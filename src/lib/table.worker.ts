import { handleTableWorkerMessage } from "./tableWorkerCore";
import type { TableWorkerRequest, TableWorkerResponse } from "../types/workerProtocol";

self.addEventListener("message", async (event: MessageEvent<TableWorkerRequest>) => {
  try {
    self.postMessage(await handleTableWorkerMessage(event.data));
  } catch (reason) {
    const response: TableWorkerResponse = {
      type: event.data.type,
      requestId: event.data.requestId,
      ...(event.data.type === "parse-file" ? { side: event.data.side } : {}),
      error: reason instanceof Error ? reason.message : String(reason),
    };
    self.postMessage(response);
  }
});
