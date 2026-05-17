import { describe, expect, it } from "vitest";
import { diffRowsToCsv } from "../../src/lib/export";

describe("diffRowsToCsv", () => {
  it("preserves the daff action column", () => {
    expect(
      diffRowsToCsv([
        ["@@", "id"],
        ["+++", "1"],
      ]),
    ).toBe("@@,id\n+++,1");
  });
});
