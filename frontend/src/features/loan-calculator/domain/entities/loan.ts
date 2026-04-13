export interface LoanInput {
  annualIncomeGross: number;
  partnerAnnualIncomeGross: number;
  existingDebt: number;
  savings: number;
  propertyPrice: number;
  interestRatePercent: number;
  loanTermYears: number;
  monthlyFixedExpenses: number;
}

export interface LoanResult {
  maxLoan: number;
  monthlyPayment: number;
  stressTestPasses: boolean;
  stressTestMonthlyPayment: number;
  availableAmount: number;
  loanToValuePercent: number;
}
