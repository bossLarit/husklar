import { z } from "zod";

const positiveNumber = z.number().min(0, "Må ikke være negativt");
const requiredPositive = z.number().positive("Skal være større end 0");

export const loanFormSchema = z.object({
  annualIncomeGross: requiredPositive,
  partnerAnnualIncomeGross: positiveNumber.default(0),
  existingDebt: positiveNumber.default(0),
  savings: positiveNumber.default(0),
  propertyPrice: requiredPositive,
  interestRatePercent: z
    .number()
    .min(0.1, "Renten skal være mindst 0,1%")
    .max(15, "Renten må ikke overstige 15%")
    .default(4),
  loanTermYears: z
    .number()
    .int("Skal være et helt tal")
    .min(1, "Minimum 1 år")
    .max(30, "Maximum 30 år")
    .default(30),
  monthlyFixedExpenses: positiveNumber.default(0),
});

// Input: before Zod defaults (form state type — fields may be undefined)
export type LoanFormInput = z.input<typeof loanFormSchema>;
// Output: after Zod defaults (validated submission type — all fields populated)
export type LoanFormValues = z.output<typeof loanFormSchema>;
