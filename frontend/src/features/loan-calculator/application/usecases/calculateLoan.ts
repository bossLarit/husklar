import type { LoanInput, LoanResult } from "../../domain/entities/loan";
import {
  calculateMonthlyPayment,
  calculateMaxLoan,
  calculateAvailableAmount,
} from "../../utils/loanMath";

const STRESS_TEST_ADDITION = 5;

export function calculateLoan(input: LoanInput): LoanResult {
  const totalAnnualIncome =
    input.annualIncomeGross + input.partnerAnnualIncomeGross;
  const maxLoan = calculateMaxLoan(totalAnnualIncome, input.existingDebt);

  const loanAmount = input.propertyPrice - input.savings;
  const monthlyPayment = calculateMonthlyPayment(
    loanAmount,
    input.interestRatePercent,
    input.loanTermYears,
  );

  const stressTestRate = input.interestRatePercent + STRESS_TEST_ADDITION;
  const stressTestMonthlyPayment = calculateMonthlyPayment(
    loanAmount,
    stressTestRate,
    input.loanTermYears,
  );

  const availableAmount = calculateAvailableAmount(
    totalAnnualIncome,
    input.monthlyFixedExpenses,
    stressTestMonthlyPayment,
  );

  return {
    maxLoan,
    monthlyPayment,
    stressTestPasses: availableAmount > 0,
    stressTestMonthlyPayment,
    availableAmount,
    loanToValuePercent: (loanAmount / input.propertyPrice) * 100,
  };
}
