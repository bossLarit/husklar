import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  loanFormSchema,
  type LoanFormInput,
  type LoanFormValues,
} from "../../application/dtos/loanFormSchema";
import { FormField } from "./FormField";
import { loanFormFields } from "./loanFormFields";

interface LoanFormProps {
  onCalculate: (values: LoanFormValues) => void;
}

export function LoanForm({ onCalculate }: LoanFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoanFormInput, unknown, LoanFormValues>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: {
      partnerAnnualIncomeGross: 0,
      existingDebt: 0,
      interestRatePercent: 4,
      loanTermYears: 30,
      monthlyFixedExpenses: 0,
    },
  });

  return (
    <form onSubmit={handleSubmit(onCalculate)} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        {loanFormFields.map((field) => (
          <FormField
            key={field.name}
            field={field}
            register={register}
            error={errors[field.name]}
          />
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
