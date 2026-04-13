import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  loanFormSchema,
  type LoanFormValues,
} from "../../application/dtos/loanFormSchema";

// Input type before Zod defaults are applied
type LoanFormInput = {
  annualIncomeGross: number;
  partnerAnnualIncomeGross: number;
  existingDebt: number;
  savings: number;
  propertyPrice: number;
  interestRatePercent: number;
  loanTermYears: number;
  monthlyFixedExpenses: number;
};

interface LoanFormProps {
  onCalculate: (values: LoanFormValues) => void;
}

const fields = [
  {
    name: "annualIncomeGross" as const,
    label: "Årlig bruttoindkomst",
    placeholder: "450.000",
    suffix: "kr.",
  },
  {
    name: "partnerAnnualIncomeGross" as const,
    label: "Partners bruttoindkomst",
    placeholder: "0",
    suffix: "kr.",
    optional: true,
  },
  {
    name: "existingDebt" as const,
    label: "Eksisterende gæld",
    placeholder: "0",
    suffix: "kr.",
    hint: "SU-lån, billån, forbrugslån",
  },
  {
    name: "propertyPrice" as const,
    label: "Boligens pris",
    placeholder: "2.500.000",
    suffix: "kr.",
  },
  {
    name: "savings" as const,
    label: "Opsparing / udbetaling",
    placeholder: "125.000",
    suffix: "kr.",
    hint: "Minimum 5% af boligens pris",
  },
  {
    name: "monthlyFixedExpenses" as const,
    label: "Faste månedlige udgifter",
    placeholder: "8.000",
    suffix: "kr./md.",
    hint: "Ejerforening, forsikring, el, varme",
  },
  {
    name: "interestRatePercent" as const,
    label: "Rente",
    placeholder: "4",
    suffix: "%",
  },
  {
    name: "loanTermYears" as const,
    label: "Løbetid",
    placeholder: "30",
    suffix: "år",
  },
];

export function LoanForm({ onCalculate }: LoanFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod v4 + hookform resolver generics mismatch
  } = useForm<LoanFormInput>({
    resolver: zodResolver(loanFormSchema) as any,
    defaultValues: {
      partnerAnnualIncomeGross: 0,
      existingDebt: 0,
      interestRatePercent: 4,
      loanTermYears: 30,
      monthlyFixedExpenses: 0,
    },
  });

  const typedErrors = errors as FieldErrors<LoanFormInput>;

  return (
    <form
      onSubmit={handleSubmit((data) =>
        onCalculate(data as unknown as LoanFormValues)
      )}
      className="flex flex-col gap-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.name} className="flex flex-col gap-1.5">
            <label
              htmlFor={field.name}
              className="text-sm font-medium text-foreground"
            >
              {field.label}
              {field.optional && (
                <span className="ml-1 text-muted-foreground">(valgfrit)</span>
              )}
            </label>
            <div className="relative">
              <input
                id={field.name}
                type="number"
                step="any"
                placeholder={field.placeholder}
                {...register(field.name, { valueAsNumber: true })}
                className={`h-10 w-full rounded-md border bg-card px-3 pr-12 text-sm transition-colors duration-200 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 ${
                  typedErrors[field.name]
                    ? "border-destructive"
                    : "border-input hover:border-primary/40"
                }`}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {field.suffix}
              </span>
            </div>
            {field.hint && !typedErrors[field.name] && (
              <p className="text-xs text-muted-foreground">{field.hint}</p>
            )}
            {typedErrors[field.name] && (
              <p className="text-xs text-destructive">
                {typedErrors[field.name]?.message}
              </p>
            )}
          </div>
        ))}
      </div>

      <button
        type="submit"
        className="mt-2 h-11 cursor-pointer rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
      >
        Beregn
      </button>

      <p className="text-xs text-muted-foreground">
        Beregningen er vejledende og erstatter ikke rådgivning fra din bank.
        Skatteberegning er forenklet (37% gennemsnit).
      </p>
    </form>
  );
}
