import type { FieldError, UseFormRegister } from "react-hook-form";
import type { LoanFormInput } from "../../application/dtos/loanFormSchema";

export interface FormFieldConfig {
  name: keyof LoanFormInput;
  label: string;
  placeholder: string;
  suffix: string;
  optional?: boolean;
  hint?: string;
}

interface FormFieldProps {
  field: FormFieldConfig;
  register: UseFormRegister<LoanFormInput>;
  error?: FieldError;
}

export function FormField({ field, register, error }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={field.name} className="text-sm font-medium text-foreground">
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
          inputMode="decimal"
          autoComplete="off"
          placeholder={field.placeholder}
          aria-describedby={
            error
              ? `${field.name}-error`
              : field.hint
                ? `${field.name}-hint`
                : undefined
          }
          aria-invalid={error ? "true" : undefined}
          {...register(field.name, { valueAsNumber: true })}
          className={`h-10 w-full rounded-md border bg-card px-3 pr-12 text-sm transition-colors duration-200 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 ${
            error
              ? "border-destructive"
              : "border-input hover:border-primary/40"
          }`}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {field.suffix}
        </span>
      </div>
      {field.hint && !error && (
        <p id={`${field.name}-hint`} className="text-xs text-muted-foreground">
          {field.hint}
        </p>
      )}
      {error && (
        <p id={`${field.name}-error`} className="text-xs text-destructive">
          {error.message}
        </p>
      )}
    </div>
  );
}
