const INCOME_MULTIPLIER = 3.5;
const MONTHS_PER_YEAR = 12;
const ESTIMATED_TAX_RATE = 0.37;

/**
 * Max loan based on Danish 3.5x annual income rule, minus existing debt.
 */
export function calculateMaxLoan(
  totalAnnualIncomeGross: number,
  existingDebt: number,
): number {
  return Math.max(0, totalAnnualIncomeGross * INCOME_MULTIPLIER - existingDebt);
}

/**
 * Standard annuity formula for monthly payment.
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRatePercent: number,
  termYears: number,
): number {
  if (principal <= 0) return 0;
  if (annualRatePercent <= 0) return principal / (termYears * MONTHS_PER_YEAR);

  const monthlyRate = annualRatePercent / 100 / MONTHS_PER_YEAR;
  const numPayments = termYears * MONTHS_PER_YEAR;
  const factor = Math.pow(1 + monthlyRate, numPayments);

  return (principal * monthlyRate * factor) / (factor - 1);
}

/**
 * Rådighedsbeløb — disposable income after tax, fixed expenses, and loan payment.
 */
export function calculateAvailableAmount(
  totalAnnualIncomeGross: number,
  monthlyFixedExpenses: number,
  monthlyLoanPayment: number,
): number {
  const monthlyNetIncome =
    (totalAnnualIncomeGross * (1 - ESTIMATED_TAX_RATE)) / MONTHS_PER_YEAR;
  return monthlyNetIncome - monthlyFixedExpenses - monthlyLoanPayment;
}
