import { describe, expect, it } from "vitest";
import { createBrowserWorkerClient } from "../../src/lib/workerClient";
import { handleTableWorkerMessage } from "../../src/lib/tableWorkerCore";
import type { CompareOptions } from "../../src/lib/types";
import type { TableWorkerResponse } from "../../src/types/workerProtocol";

const options: CompareOptions = {
  show_unchanged: false,
  show_unchanged_columns: false,
  ignore_whitespace: false,
  ignore_case: false,
  show_order: true,
};

describe("handleTableWorkerMessage", () => {
  it("parses files and compares rows", async () => {
    const parsed = await handleTableWorkerMessage({
      type: "parse-file",
      requestId: 1,
      side: "left",
      file: new File(["id,name\n1,Alice\n"], "left.csv", { type: "text/csv" }),
    });

    expect(parsed).toMatchObject({
      type: "parse-file",
      requestId: 1,
      side: "left",
      file: {
        name: "left.csv",
        rows: [
          ["id", "name"],
          ["1", "Alice"],
        ],
      },
    });

    if (parsed.type !== "parse-file") throw new Error("Expected parsed file response.");

    const compared = await handleTableWorkerMessage({
      type: "compare-rows",
      requestId: 2,
      leftRows: parsed.file.rows,
      rightRows: [
        ["id", "name"],
        ["1", "Alicia"],
      ],
      options,
    });

    if (compared.type !== "compare-rows") throw new Error("Expected compare response.");

    expect(compared.result.summary.row_updates).toBeGreaterThan(0);
  });
});

describe("createBrowserWorkerClient", () => {
  it("marks older responses as stale", async () => {
    const listeners: ((event: MessageEvent<TableWorkerResponse>) => void)[] = [];
    const worker = {
      addEventListener(
        _type: "message",
        listener: (event: MessageEvent<TableWorkerResponse>) => void,
      ) {
        listeners.push(listener);
      },
      postMessage() {},
      terminate() {},
    } as unknown as Worker;
    const client = createBrowserWorkerClient(worker);
    const first = client.compareRows([], [], options);
    const second = client.compareRows([], [], options);

    listeners[0]({
      data: { type: "compare-rows", requestId: 1, result: "old" } as unknown as TableWorkerResponse,
    } as MessageEvent<TableWorkerResponse>);
    listeners[0]({
      data: { type: "compare-rows", requestId: 2, result: "new" } as unknown as TableWorkerResponse,
    } as MessageEvent<TableWorkerResponse>);

    await expect(first).resolves.toEqual({ stale: true });
    await expect(second).resolves.toEqual({
      stale: false,
      data: { type: "compare-rows", requestId: 2, result: "new" },
    });
  });
});
