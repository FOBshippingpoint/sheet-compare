import type {
  CompareOptions,
  DiffResult,
  SelectedTableFile,
  SheetSide,
  TableRows,
} from "../lib/types";

export type WorkerRequestId = number;

type TableWorkerMessages = {
  "parse-file": {
    request: {
      side: SheetSide;
      file: File;
      sheetName?: string;
    };
    response: {
      side: SheetSide;
      file: SelectedTableFile;
    };
  };
  "compare-rows": {
    request: {
      leftRows: TableRows;
      rightRows: TableRows;
      options: CompareOptions;
    };
    response: {
      result: DiffResult;
    };
  };
};

export type TableWorkerMessageType = keyof TableWorkerMessages;

export type TableWorkerRequest<Type extends TableWorkerMessageType = TableWorkerMessageType> = {
  [Key in Type]: {
    type: Key;
    requestId: WorkerRequestId;
  } & TableWorkerMessages[Key]["request"];
}[Type];

export type TableWorkerRequestInput<Type extends TableWorkerMessageType = TableWorkerMessageType> =
  {
    [Key in Type]: Omit<TableWorkerRequest<Key>, "requestId">;
  }[Type];

export type TableWorkerDataResponse<Type extends TableWorkerMessageType = TableWorkerMessageType> =
  {
    [Key in Type]: {
      type: Key;
      requestId: WorkerRequestId;
    } & TableWorkerMessages[Key]["response"];
  }[Type];

export type TableWorkerErrorResponse<Type extends TableWorkerMessageType = TableWorkerMessageType> =
  {
    type: Type;
    requestId: WorkerRequestId;
    side?: Type extends "parse-file" ? SheetSide : never;
    error: string;
  };

export type TableWorkerResponse<Type extends TableWorkerMessageType = TableWorkerMessageType> =
  | TableWorkerDataResponse<Type>
  | TableWorkerErrorResponse<Type>;

export type WorkerClientResult<Type extends TableWorkerMessageType> =
  | { stale: true }
  | { stale: false; data: TableWorkerDataResponse<Type> };

export type WorkerClientResultFor<Message extends TableWorkerRequestInput> = WorkerClientResult<
  Message["type"]
>;

export type TableWorkerClient = {
  parseFile(
    side: SheetSide,
    file: File,
    sheetName?: string,
  ): Promise<WorkerClientResult<"parse-file">>;
  compareRows(
    leftRows: TableRows,
    rightRows: TableRows,
    options: CompareOptions,
  ): Promise<WorkerClientResult<"compare-rows">>;
  destroy(): void;
};
