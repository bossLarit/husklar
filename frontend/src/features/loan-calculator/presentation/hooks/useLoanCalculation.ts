import { useMemo } from "react";
import type { LoanFormValues } from "../../application/dtos/loanFormSchema";
import type { LoanResult } from "../../domain/entities/loan";
import { calculateLoan } from "../../application/usecases/calculateLoan";

export function useLoanCalculation(
  values: LoanFormValues | null,
): LoanResult | null {
  return useMemo(() => {
    if (!values) return null;
    return calculateLoan(values);
  }, [values]);
}
