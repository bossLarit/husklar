import { describe, expect, it } from "vitest";
import {
  calculateMaxLoan,
  calculateMonthlyPayment,
  calculateAvailableAmount,
} from "./loanMath";

describe("calculateMaxLoan", () => {
  it("returns 3.5x income minus existing debt", () => {
    expect(calculateMaxLoan(600_000, 100_000)).toBe(2_000_000);
  });

  it("returns 0 when debt exceeds 3.5x income", () => {
    expect(calculateMaxLoan(100_000, 500_000)).toBe(0);
  });

  it("returns 3.5x income when no debt", () => {
    expect(calculateMaxLoan(500_000, 0)).toBe(1_750_000);
  });
});

describe("calculateMonthlyPayment", () => {
  it("returns correct annuity payment", () => {
    const payment = calculateMonthlyPayment(1_000_000, 4, 30);
    expect(payment).toBeCloseTo(4774.15, 0);
  });

  it("returns 0 for zero principal", () => {
    expect(calculateMonthlyPayment(0, 4, 30)).toBe(0);
  });

  it("handles zero interest rate", () => {
    const payment = calculateMonthlyPayment(360_000, 0, 30);
    expect(payment).toBe(1000);
  });
});

describe("calculateAvailableAmount", () => {
  it("calculates disposable income correctly", () => {
    const available = calculateAvailableAmount(600_000, 10_000, 5_000);
    const expectedNet = (600_000 * 0.63) / 12;
    expect(available).toBeCloseTo(expectedNet - 10_000 - 5_000, 0);
  });
});
