import { handleTableWorkerMessage } from "./tableWorkerCore.js";

export function createTableWorkerClient() {
  if (typeof Worker === "undefined") return createDirectClient();

  return createBrowserWorkerClient(
    new Worker(new URL("./table.worker.js", import.meta.url), { type: "module" }),
  );
}

export function createBrowserWorkerClient(worker) {
  let nextRequestId = 1;
  const pending = new Map();
  const latestByType = new Map();

  worker.addEventListener("message", (event) => {
    const pendingRequest = pending.get(event.data.requestId);

    if (!pendingRequest) return;

    pending.delete(event.data.requestId);

    if (latestByType.get(pendingRequest.key) !== event.data.requestId) {
      pendingRequest.resolve({ stale: true });
      return;
    }

    if (event.data.error) pendingRequest.reject(new Error(event.data.error));
    else pendingRequest.resolve({ stale: false, data: event.data });
  });

  function request(message) {
    const requestId = nextRequestId++;
    const typedMessage = plainMessage({ ...message, requestId });
    const key = requestKey(message);

    latestByType.set(key, requestId);
    worker.postMessage(typedMessage);

    return new Promise((resolve, reject) => {
      pending.set(requestId, { key, resolve, reject });
    });
  }

  return {
    parseFile(side, file, sheetName) {
      return request({ type: "parse-file", side, file, sheetName });
    },
    compareRows(leftRows, rightRows, options) {
      return request({ type: "compare-rows", leftRows, rightRows, options });
    },
    destroy() {
      worker.terminate();
      pending.clear();
    },
  };
}

function requestKey(message) {
  return message.side ? `${message.type}:${message.side}` : message.type;
}

function plainMessage(message) {
  if (message.type !== "compare-rows") return message;

  return {
    ...message,
    leftRows: plainRows(message.leftRows),
    rightRows: plainRows(message.rightRows),
    options: { ...message.options },
  };
}

function plainRows(rows) {
  return rows.map((row) => row.map((cell) => (cell == null ? "" : String(cell))));
}

function createDirectClient() {
  let latestRequestId = 0;

  async function request(message) {
    const requestId = latestRequestId + 1;
    latestRequestId = requestId;
    const data = await handleTableWorkerMessage(plainMessage({ ...message, requestId }));

    return { stale: requestId !== latestRequestId, data };
  }

  return {
    parseFile(side, file, sheetName) {
      return request({ type: "parse-file", side, file, sheetName });
    },
    compareRows(leftRows, rightRows, options) {
      return request({ type: "compare-rows", leftRows, rightRows, options });
    },
    destroy() {},
  };
}
