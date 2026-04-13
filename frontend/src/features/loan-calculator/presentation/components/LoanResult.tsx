import type { LoanResult as LoanResultType } from "../../domain/entities/loan";
import { formatDKK } from "@/core/utils/formatCurrency";

interface LoanResultProps {
  result: LoanResultType;
  propertyPrice: number;
  savings: number;
}

export function LoanResult({ result, propertyPrice, savings }: LoanResultProps) {
  const loanAmount = propertyPrice - savings;
  const ltvWarning = result.loanToValuePercent > 95;
  const ltvCaution = result.loanToValuePercent > 80;

  return (
    <div className="flex flex-col gap-6">
      {/* Main result */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold">Dit lån</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <ResultItem
            label="Lånebeløb"
            value={formatDKK(loanAmount)}
            sublabel={`${result.loanToValuePercent.toFixed(0)}% belåning`}
          />
          <ResultItem
            label="Månedlig ydelse"
            value={formatDKK(Math.round(result.monthlyPayment))}
            sublabel="Før skat"
          />
          <ResultItem
            label="Max belåning (3,5× regel)"
            value={formatDKK(result.maxLoan)}
            sublabel={
              loanAmount > result.maxLoan
                ? "Lånet overstiger din max belåning"
                : "Du er inden for grænsen"
            }
            warning={loanAmount > result.maxLoan}
          />
          <ResultItem
            label="Rådighedsbeløb"
            value={formatDKK(Math.round(result.availableAmount))}
            sublabel="Pr. måned efter alle udgifter"
            warning={result.availableAmount < 5000}
          />
        </div>
      </div>

      {/* Stress test */}
      <div
        className={`rounded-xl border p-6 ${
          result.stressTestPasses
            ? "border-risk-green/30 bg-risk-green/5"
            : "border-risk-red/30 bg-risk-red/5"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 h-5 w-5 flex-shrink-0 rounded-full ${
              result.stressTestPasses ? "bg-risk-green" : "bg-risk-red"
            }`}
          />
          <div>
            <h3 className="font-semibold">
              {result.stressTestPasses
                ? "Stresstest bestået"
                : "Stresstest ikke bestået"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Ved +5% rente ville din månedlige ydelse være{" "}
              <strong>
                {formatDKK(Math.round(result.stressTestMonthlyPayment))}
              </strong>
              .{" "}
              {result.stressTestPasses
                ? "Du har stadig råd efter stresstesten."
                : "Dit rådighedsbeløb bliver negativt. Banken vil sandsynligvis ikke godkende dette lån."}
            </p>
          </div>
        </div>
      </div>

      {/* LTV warning */}
      {ltvWarning && (
        <div className="rounded-xl border border-risk-red/30 bg-risk-red/5 p-6">
          <p className="text-sm font-medium text-destructive">
            Din belåningsgrad er over 95%. De fleste banker kræver minimum 5%
            udbetaling. Overvej at øge din opsparing.
          </p>
        </div>
      )}
      {!ltvWarning && ltvCaution && (
        <div className="rounded-xl border border-risk-yellow/30 bg-risk-yellow/5 p-6">
          <p className="text-sm font-medium">
            Din belåningsgrad er over 80%. Du vil sandsynligvis behøve både et
            realkreditlån (80%) og et banklån for resten, som typisk har højere
            rente.
          </p>
        </div>
      )}
    </div>
  );
}

function ResultItem({
  label,
  value,
  sublabel,
  warning = false,
}: {
  label: string;
  value: string;
  sublabel: string;
  warning?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-2xl font-semibold">{value}</span>
      <span
        className={`text-xs ${warning ? "font-medium text-destructive" : "text-muted-foreground"}`}
      >
        {sublabel}
      </span>
    </div>
  );
}
