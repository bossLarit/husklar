import type { Borders, Workbook, Worksheet } from "exceljs";
import type { Budget, BudgetSection } from "../domain/budgetTemplate";

const COLOR = {
  accent: "FF0D9488",
  accentLight: "FFCCFBF1",
  text: "FF0F172A",
  muted: "FF64748B",
  border: "FFE2E8F0",
  headerFill: "FFF1F5F9",
  zebraFill: "FFF8FAFC",
  white: "FFFFFFFF",
  green: "FF16A34A",
  red: "FFDC2626",
} as const;

const FONT_BODY = { name: "Calibri", size: 11 };
const FONT_BOLD = { name: "Calibri", size: 11, bold: true };
const FONT_HEADER = { name: "Calibri", size: 12, bold: true };
const FONT_TITLE = { name: "Calibri", size: 16, bold: true };

const DKK_FMT = '#,##0 "kr"';

type ExcelJSModule = typeof import("exceljs");
let excelJsPromise: Promise<ExcelJSModule> | null = null;

async function loadExcelJS(): Promise<ExcelJSModule> {
  if (!excelJsPromise) {
    excelJsPromise = import("exceljs");
  }
  return excelJsPromise;
}

function thinBorder(color = COLOR.border): Partial<Borders> {
  const side = { style: "thin" as const, color: { argb: color } };
  return { top: side, left: side, right: side, bottom: side };
}

function formatDateDa(date: Date): string {
  return new Intl.DateTimeFormat("da-DK", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

interface SectionRowRef {
  name: string;
  kind: BudgetSection["kind"];
  totalCellRef: string;
}

function writeSection(
  ws: Worksheet,
  section: BudgetSection,
  startRow: number,
): { nextRow: number; ref: SectionRowRef } {
  let r = startRow;

  // Section header (merged A:B)
  ws.mergeCells(r, 1, r, 2);
  const headerCell = ws.getCell(r, 1);
  headerCell.value = section.name.toUpperCase();
  headerCell.font = { ...FONT_HEADER, color: { argb: COLOR.white } };
  headerCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: COLOR.accent },
  };
  headerCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(r).height = 22;
  r += 1;

  // Column headers
  const colHeaderRow = ws.getRow(r);
  colHeaderRow.values = ["Post", "Beløb (kr/md)"];
  colHeaderRow.eachCell((cell) => {
    cell.font = FONT_BOLD;
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLOR.headerFill },
    };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = { bottom: { style: "thin", color: { argb: COLOR.border } } };
  });
  ws.getCell(r, 2).alignment = { vertical: "middle", horizontal: "right" };
  r += 1;

  // Data rows
  const firstDataRow = r;
  if (section.rows.length === 0) {
    const emptyCell = ws.getCell(r, 1);
    emptyCell.value = "(ingen poster)";
    emptyCell.font = { ...FONT_BODY, italic: true, color: { argb: COLOR.muted } };
    ws.getCell(r, 2).value = 0;
    ws.getCell(r, 2).numFmt = DKK_FMT;
    r += 1;
  } else {
    section.rows.forEach((row, i) => {
      const labelCell = ws.getCell(r, 1);
      labelCell.value = row.label || "(uden navn)";
      labelCell.font = FONT_BODY;

      const amountCell = ws.getCell(r, 2);
      amountCell.value = Math.round(row.amount) || 0;
      amountCell.font = FONT_BODY;
      amountCell.numFmt = DKK_FMT;
      amountCell.alignment = { horizontal: "right" };

      if (i % 2 === 1) {
        for (const cell of [labelCell, amountCell]) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: COLOR.zebraFill },
          };
        }
      }
      r += 1;
    });
  }
  const lastDataRow = r - 1;

  // Total row
  const totalLabel = ws.getCell(r, 1);
  totalLabel.value = `Total ${section.name.toLowerCase()}`;
  totalLabel.font = FONT_BOLD;
  totalLabel.border = {
    top: { style: "thin", color: { argb: COLOR.accent } },
  };

  const totalCell = ws.getCell(r, 2);
  totalCell.value = {
    formula: `SUM(B${firstDataRow}:B${lastDataRow})`,
  };
  totalCell.font = FONT_BOLD;
  totalCell.numFmt = DKK_FMT;
  totalCell.alignment = { horizontal: "right" };
  totalCell.border = {
    top: { style: "thin", color: { argb: COLOR.accent } },
  };

  const totalCellRef = `B${r}`;
  r += 1;

  // Blank separator row
  r += 1;

  return {
    nextRow: r,
    ref: { name: section.name, kind: section.kind, totalCellRef },
  };
}

function writeSummary(
  ws: Worksheet,
  startRow: number,
  refs: SectionRowRef[],
): void {
  let r = startRow;

  // Summary header (merged)
  ws.mergeCells(r, 1, r, 2);
  const header = ws.getCell(r, 1);
  header.value = "SAMLET OVERSIGT";
  header.font = { ...FONT_HEADER, color: { argb: COLOR.white } };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: COLOR.accent },
  };
  header.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(r).height = 22;
  r += 1;

  const incomeRefs = refs.filter((x) => x.kind === "income");
  const expenseRefs = refs.filter((x) => x.kind === "expense");

  const incomeFormula = incomeRefs.length
    ? incomeRefs.map((x) => x.totalCellRef).join("+")
    : "0";
  const expenseFormula = expenseRefs.length
    ? expenseRefs.map((x) => x.totalCellRef).join("+")
    : "0";

  // Indtægter i alt
  ws.getCell(r, 1).value = "Indtægter i alt";
  ws.getCell(r, 1).font = FONT_BODY;
  ws.getCell(r, 2).value = { formula: incomeFormula };
  ws.getCell(r, 2).font = FONT_BODY;
  ws.getCell(r, 2).numFmt = DKK_FMT;
  ws.getCell(r, 2).alignment = { horizontal: "right" };
  const incomeRef = `B${r}`;
  r += 1;

  // Udgifter i alt
  ws.getCell(r, 1).value = "Udgifter i alt";
  ws.getCell(r, 1).font = FONT_BODY;
  ws.getCell(r, 2).value = { formula: expenseFormula };
  ws.getCell(r, 2).font = FONT_BODY;
  ws.getCell(r, 2).numFmt = DKK_FMT;
  ws.getCell(r, 2).alignment = { horizontal: "right" };
  const expenseRef = `B${r}`;
  r += 1;

  // Overskud / underskud (bold, top border)
  const netLabel = ws.getCell(r, 1);
  netLabel.value = "Overskud / underskud";
  netLabel.font = FONT_BOLD;
  netLabel.border = {
    top: { style: "medium", color: { argb: COLOR.text } },
  };

  const netCell = ws.getCell(r, 2);
  netCell.value = { formula: `${incomeRef}-${expenseRef}` };
  netCell.font = FONT_BOLD;
  netCell.numFmt = DKK_FMT;
  netCell.alignment = { horizontal: "right" };
  netCell.border = {
    top: { style: "medium", color: { argb: COLOR.text } },
  };

  // Conditional formatting: green if >=0, red if <0
  ws.addConditionalFormatting({
    ref: `B${r}`,
    rules: [
      {
        type: "cellIs",
        operator: "greaterThan",
        priority: 1,
        formulae: ["0"],
        style: { font: { color: { argb: COLOR.green }, bold: true } },
      },
      {
        type: "cellIs",
        operator: "lessThan",
        priority: 2,
        formulae: ["0"],
        style: { font: { color: { argb: COLOR.red }, bold: true } },
      },
    ],
  });
}

export async function buildBudgetWorkbook(budget: Budget): Promise<Workbook> {
  const ExcelJSNs = await loadExcelJS();
  const ExcelJS = (ExcelJSNs as unknown as { default?: ExcelJSModule }).default ?? ExcelJSNs;

  const wb = new ExcelJS.Workbook();
  wb.creator = "HusKlar";
  wb.created = new Date();
  wb.title = "HusKlar Budget";

  const ws = wb.addWorksheet("Budget", {
    views: [{ state: "frozen", ySplit: 3 }],
    properties: { defaultRowHeight: 18 },
    pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true },
  });

  ws.getColumn(1).width = 34;
  ws.getColumn(2).width = 18;

  // Title block
  ws.mergeCells("A1:B1");
  const title = ws.getCell("A1");
  title.value = "HUSKLAR BUDGET";
  title.font = { ...FONT_TITLE, color: { argb: COLOR.text } };
  title.alignment = { vertical: "middle", horizontal: "left" };
  ws.getRow(1).height = 30;

  ws.mergeCells("A2:B2");
  const meta = ws.getCell("A2");
  meta.value = `Udarbejdet ${formatDateDa(new Date())}`;
  meta.font = { ...FONT_BODY, color: { argb: COLOR.muted } };
  meta.alignment = { vertical: "middle", horizontal: "left" };

  // Blank separator
  let row = 4;

  // Sections (income first, then expenses)
  const ordered = [
    ...budget.sections.filter((s) => s.kind === "income"),
    ...budget.sections.filter((s) => s.kind === "expense"),
  ];

  const refs: SectionRowRef[] = [];
  for (const section of ordered) {
    const { nextRow, ref } = writeSection(ws, section, row);
    refs.push(ref);
    row = nextRow;
  }

  writeSummary(ws, row, refs);

  // Thin outer borders around total column for visual polish
  ws.getColumn(2).alignment = { horizontal: "right" };

  // Suppress unused-variable warning if skill adds helpers later
  void thinBorder;

  return wb;
}

export async function downloadBudgetXlsx(budget: Budget): Promise<void> {
  const wb = await buildBudgetWorkbook(budget);
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const iso = new Date().toISOString().slice(0, 10);
  const a = document.createElement("a");
  a.href = url;
  a.download = `husklar-budget-${iso}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
