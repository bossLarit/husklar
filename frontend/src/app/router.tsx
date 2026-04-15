import { createBrowserRouter } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { LandingPage } from "@/features/landing/LandingPage";
import { ReportAnalysisPage } from "@/features/report-analysis/ReportAnalysisPage";
import { LoanCalculatorPage } from "@/features/loan-calculator/LoanCalculatorPage";
import { SurroundingsPage } from "@/features/surroundings/SurroundingsPage";
import { BudgetPage } from "@/features/budget/BudgetPage";
import { ChecklistPage } from "@/features/checklist/ChecklistPage";
import { AnnualCostsPage } from "@/features/annual-costs/AnnualCostsPage";
import { AdminPage } from "@/features/admin/AdminPage";

const base = import.meta.env.BASE_URL;

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "rapport", element: <ReportAnalysisPage /> },
      { path: "laaneberegner", element: <LoanCalculatorPage /> },
      { path: "omgivelser", element: <SurroundingsPage /> },
      { path: "budget", element: <BudgetPage /> },
      { path: "tjekliste", element: <ChecklistPage /> },
      { path: "omkostninger", element: <AnnualCostsPage /> },
      { path: "admin", element: <AdminPage /> },
    ],
  },
], { basename: base });
