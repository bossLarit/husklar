import { useState } from "react";
import { useDocumentTitle } from "@/core/hooks/useDocumentTitle";
import { useMetaDescription } from "@/core/hooks/useMetaDescription";
import type { LoanFormValues } from "./application/dtos/loanFormSchema";
import { useLoanCalculation } from "./presentation/hooks/useLoanCalculation";
import { LoanForm } from "./presentation/components/LoanForm";
import { LoanResult } from "./presentation/components/LoanResult";

export function LoanCalculatorPage() {
  useDocumentTitle("Låneberegner");
  useMetaDescription(
    "Beregn din max belåning, månedlige ydelse og bestå din egen stresstest. Baseret på danske bankkriterier — 3,5x indkomstregel og rådighedsbeløb.",
  );
  const [formValues, setFormValues] = useState<LoanFormValues | null>(null);
  const result = useLoanCalculation(formValues);

  return (
    <article className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-semibold">Låneberegner</h1>
        <p className="mt-2 text-muted-foreground">
          Beregn din købekraft baseret på danske bankkriterier. Indtast din
          økonomi og se hvad du kan låne.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-label="Indtast din økonomi">
          <LoanForm onCalculate={setFormValues} />
        </section>
        <section aria-label="Beregningsresultat">
          {result && formValues ? (
            <LoanResult
              result={result}
              propertyPrice={formValues.propertyPrice}
              savings={formValues.savings}
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border p-12">
              <p className="text-center text-sm text-muted-foreground">
                Udfyld formularen og tryk "Beregn" for at se dit resultat.
              </p>
            </div>
          )}
        </section>
      </div>
    </article>
  );
}
