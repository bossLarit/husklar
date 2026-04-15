export type SectionKind = "income" | "expense";

export interface BudgetRow {
  id: string;
  label: string;
  amount: number;
}

export interface BudgetSection {
  id: string;
  name: string;
  kind: SectionKind;
  rows: BudgetRow[];
}

export interface Budget {
  sections: BudgetSection[];
}

let idCounter = 0;
export function newId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

function row(label: string): BudgetRow {
  return { id: newId("row"), label, amount: 0 };
}

export function defaultBudget(): Budget {
  return {
    sections: [
      {
        id: newId("sec"),
        name: "Indtægter",
        kind: "income",
        rows: [row("Løn efter skat"), row("SU"), row("Andre indtægter")],
      },
      {
        id: newId("sec"),
        name: "Bolig",
        kind: "expense",
        rows: [
          row("Husleje / afdrag"),
          row("El"),
          row("Vand"),
          row("Varme"),
          row("Internet"),
          row("Boligforsikring"),
        ],
      },
      {
        id: newId("sec"),
        name: "Transport",
        kind: "expense",
        rows: [
          row("Benzin / brændstof"),
          row("Bilforsikring"),
          row("Offentlig transport"),
        ],
      },
      {
        id: newId("sec"),
        name: "Mad & husholdning",
        kind: "expense",
        rows: [row("Dagligvarer"), row("Take-away / restaurant"), row("Husholdning")],
      },
      {
        id: newId("sec"),
        name: "Forsikringer",
        kind: "expense",
        rows: [row("Indboforsikring"), row("Ulykkesforsikring")],
      },
      {
        id: newId("sec"),
        name: "Abonnementer",
        kind: "expense",
        rows: [row("Telefon"), row("Streaming"), row("Fitness")],
      },
      {
        id: newId("sec"),
        name: "Opsparing",
        kind: "expense",
        rows: [row("Pension"), row("Buffer-opsparing"), row("Mål-opsparing")],
      },
      {
        id: newId("sec"),
        name: "Øvrigt",
        kind: "expense",
        rows: [],
      },
    ],
  };
}

export function sectionTotal(section: BudgetSection): number {
  return section.rows.reduce((sum, r) => sum + (Number.isFinite(r.amount) ? r.amount : 0), 0);
}

export function totals(budget: Budget): {
  income: number;
  expense: number;
  net: number;
} {
  let income = 0;
  let expense = 0;
  for (const s of budget.sections) {
    const t = sectionTotal(s);
    if (s.kind === "income") income += t;
    else expense += t;
  }
  return { income, expense, net: income - expense };
}
