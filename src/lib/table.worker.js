import { handleTableWorkerMessage } from "./tableWorkerCore.js";

self.addEventListener("message", async (event) => {
  try {
    self.postMessage(await handleTableWorkerMessage(event.data));
  } catch (reason) {
    self.postMessage({
      type: event.data.type,
      requestId: event.data.requestId,
      side: event.data.side,
      error: reason instanceof Error ? reason.message : String(reason),
    });
  }
});
