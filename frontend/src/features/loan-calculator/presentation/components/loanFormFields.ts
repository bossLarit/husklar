import type { FormFieldConfig } from "./FormField";

export const loanFormFields: FormFieldConfig[] = [
  {
    name: "annualIncomeGross",
    label: "Årlig bruttoindkomst",
    placeholder: "450.000",
    suffix: "kr.",
  },
  {
    name: "partnerAnnualIncomeGross",
    label: "Partners bruttoindkomst",
    placeholder: "0",
    suffix: "kr.",
    optional: true,
  },
  {
    name: "existingDebt",
    label: "Eksisterende gæld",
    placeholder: "0",
    suffix: "kr.",
    hint: "SU-lån, billån, forbrugslån",
  },
  {
    name: "propertyPrice",
    label: "Boligens pris",
    placeholder: "2.500.000",
    suffix: "kr.",
  },
  {
    name: "savings",
    label: "Opsparing / udbetaling",
    placeholder: "125.000",
    suffix: "kr.",
    hint: "Minimum 5% af boligens pris",
  },
  {
    name: "monthlyFixedExpenses",
    label: "Faste månedlige udgifter",
    placeholder: "8.000",
    suffix: "kr./md.",
    hint: "Ejerforening, forsikring, el, varme",
  },
  {
    name: "interestRatePercent",
    label: "Rente",
    placeholder: "4",
    suffix: "%",
  },
  {
    name: "loanTermYears",
    label: "Løbetid",
    placeholder: "30",
    suffix: "år",
  },
];
