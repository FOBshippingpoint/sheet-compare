import { describe, expect, it } from "vitest";
import { createBrowserWorkerClient } from "../../src/lib/workerClient.js";
import { handleTableWorkerMessage } from "../../src/lib/tableWorkerCore.js";

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

    const compared = await handleTableWorkerMessage({
      type: "compare-rows",
      requestId: 2,
      leftRows: parsed.file.rows,
      rightRows: [
        ["id", "name"],
        ["1", "Alicia"],
      ],
      options: {
        show_unchanged: false,
        show_unchanged_columns: false,
        ignore_whitespace: false,
        ignore_case: false,
        show_order: true,
      },
    });

    expect(compared.result.summary.row_updates).toBeGreaterThan(0);
  });
});

describe("createBrowserWorkerClient", () => {
  it("marks older responses as stale", async () => {
    const listeners = [];
    const worker = {
      addEventListener(_type, listener) {
        listeners.push(listener);
      },
      postMessage() {},
      terminate() {},
    };
    const client = createBrowserWorkerClient(worker);
    const first = client.compareRows([], [], {});
    const second = client.compareRows([], [], {});

    listeners[0]({ data: { type: "compare-rows", requestId: 1, result: "old" } });
    listeners[0]({ data: { type: "compare-rows", requestId: 2, result: "new" } });

    await expect(first).resolves.toEqual({ stale: true });
    await expect(second).resolves.toEqual({
      stale: false,
      data: { type: "compare-rows", requestId: 2, result: "new" },
    });
  });
});
