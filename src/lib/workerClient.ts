import type {
  TableWorkerClient,
  TableWorkerRequest,
  TableWorkerRequestInput,
  TableWorkerResponse,
  TableWorkerMessageType,
  WorkerClientResult,
  WorkerClientResultFor,
} from "../types/workerProtocol";
import type { CompareOptions, SheetSide, TableRows } from "./types";

type PendingRequest = {
  key: string;
  resolve: (result: WorkerClientResult<TableWorkerMessageType>) => void;
  reject: (reason?: unknown) => void;
};

export function createTableWorkerClient(): TableWorkerClient {
  return createBrowserWorkerClient(
    new Worker(new URL("./table.worker.ts", import.meta.url), { type: "module" }),
  );
}

export function createBrowserWorkerClient(worker: Worker): TableWorkerClient {
  let nextRequestId = 1;
  const pending = new Map<number, PendingRequest>();
  const latestByType = new Map<string, number>();

  worker.addEventListener("message", (event: MessageEvent<TableWorkerResponse>) => {
    const pendingRequest = pending.get(event.data.requestId);

    if (!pendingRequest) return;

    pending.delete(event.data.requestId);

    if (latestByType.get(pendingRequest.key) !== event.data.requestId) {
      pendingRequest.resolve({ stale: true });
      return;
    }

    if ("error" in event.data) pendingRequest.reject(new Error(event.data.error));
    else pendingRequest.resolve({ stale: false, data: event.data });
  });

  function request<Message extends TableWorkerRequestInput>(
    message: Message,
  ): Promise<WorkerClientResultFor<Message>> {
    const requestId = nextRequestId++;
    const typedMessage = plainMessage({
      ...message,
      requestId,
    } as unknown as TableWorkerRequest);
    const key = requestKey(message);

    latestByType.set(key, requestId);
    worker.postMessage(typedMessage);

    return new Promise<WorkerClientResult<TableWorkerMessageType>>((resolve, reject) => {
      pending.set(requestId, { key, resolve, reject });
    }) as Promise<WorkerClientResultFor<Message>>;
  }

  return {
    parseFile(side: SheetSide, file: File, sheetName?: string) {
      return request({ type: "parse-file", side, file, sheetName });
    },
    compareRows(leftRows: TableRows, rightRows: TableRows, options: CompareOptions) {
      return request({ type: "compare-rows", leftRows, rightRows, options });
    },
    destroy() {
      worker.terminate();
      pending.clear();
    },
  };
}

function requestKey(message: TableWorkerRequestInput): string {
  return message.type === "parse-file" ? `${message.type}:${message.side}` : message.type;
}

function plainMessage(message: TableWorkerRequest): TableWorkerRequest {
  if (message.type !== "compare-rows") return message;

  return {
    ...message,
    leftRows: plainRows(message.leftRows),
    rightRows: plainRows(message.rightRows),
    options: { ...message.options },
  };
}

function plainRows(rows: TableRows): TableRows {
  return rows.map((row) => row.map((cell) => cell?.toString() ?? ""));
}
