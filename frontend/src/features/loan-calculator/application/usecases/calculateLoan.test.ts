import { describe, expect, it } from "vitest";
import { calculateLoan } from "./calculateLoan";
import type { LoanInput } from "../../domain/entities/loan";

const baseInput: LoanInput = {
  annualIncomeGross: 500_000,
  partnerAnnualIncomeGross: 0,
  existingDebt: 0,
  savings: 250_000,
  propertyPrice: 2_500_000,
  interestRatePercent: 4,
  loanTermYears: 30,
  monthlyFixedExpenses: 8_000,
};

describe("calculateLoan", () => {
  it("returns max loan based on 3.5x income", () => {
    const result = calculateLoan(baseInput);
    expect(result.maxLoan).toBe(1_750_000);
  });

  it("calculates LTV from property price and savings", () => {
    const result = calculateLoan(baseInput);
    // loan = 2.5M - 250k = 2.25M → 90% LTV
    expect(result.loanToValuePercent).toBe(90);
  });

  it("combines partner income for max loan", () => {
    const result = calculateLoan({
      ...baseInput,
      annualIncomeGross: 400_000,
      partnerAnnualIncomeGross: 300_000,
    });
    expect(result.maxLoan).toBe(700_000 * 3.5);
  });

  it("fails stress test when disposable income goes negative", () => {
    const result = calculateLoan({
      ...baseInput,
      annualIncomeGross: 200_000, // low income
      monthlyFixedExpenses: 10_000,
    });
    expect(result.stressTestPasses).toBe(false);
  });

  it("passes stress test when income is sufficient", () => {
    const result = calculateLoan({
      ...baseInput,
      annualIncomeGross: 800_000,
    });
    expect(result.stressTestPasses).toBe(true);
  });
});
