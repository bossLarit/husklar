import { describe, expect, it } from "vitest";
import { formatDKK } from "./formatCurrency";

describe("formatDKK", () => {
  it("formats whole amounts with Danish separators", () => {
    expect(formatDKK(1_000_000)).toMatch(/1\.000\.000/);
  });

  it("includes DKK currency", () => {
    expect(formatDKK(500)).toContain("kr.");
  });

  it("rounds to no decimals", () => {
    const result = formatDKK(1234.56);
    expect(result).not.toContain(",");
    expect(result).not.toContain(".5");
  });

  it("handles zero", () => {
    expect(formatDKK(0)).toContain("0");
  });
});
