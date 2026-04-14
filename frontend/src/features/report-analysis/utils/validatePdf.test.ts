import { describe, expect, it } from "vitest";
import { validatePdf } from "./validatePdf";

function makeFile(type: string, size: number): File {
  const blob = new Blob([new Uint8Array(size)], { type });
  return new File([blob], "test.pdf", { type });
}

describe("validatePdf", () => {
  it("accepts a valid PDF under 10 MB", () => {
    const file = makeFile("application/pdf", 1024);
    expect(validatePdf(file)).toBeNull();
  });

  it("rejects non-PDF files", () => {
    const file = makeFile("image/png", 1024);
    expect(validatePdf(file)).toContain("PDF");
  });

  it("rejects files over 10 MB", () => {
    const file = makeFile("application/pdf", 11 * 1024 * 1024);
    expect(validatePdf(file)).toContain("10 MB");
  });

  it("accepts exactly 10 MB", () => {
    const file = makeFile("application/pdf", 10 * 1024 * 1024);
    expect(validatePdf(file)).toBeNull();
  });
});
