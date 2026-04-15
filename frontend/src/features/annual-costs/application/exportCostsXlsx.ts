import type { Workbook, Worksheet } from "exceljs";
import type {
  AnnualCostBreakdown,
  CostInputs,
  OneTimeCostBreakdown,
} from "../domain/costCalculation";
import { BOLIG_TYPE_LABEL } from "../domain/costCalculation";

const COLOR = {
  accent: "FF0D9488",
  text: "FF0F172A",
  muted: "FF64748B",
  border: "FFE2E8F0",
  headerFill: "FFF1F5F9",
  zebraFill: "FFF8FAFC",
  white: "FFFFFFFF",
} as const;

const FONT_BODY = { name: "Calibri", size: 11 };
const FONT_BOLD = { name: "Calibri", size: 11, bold: true };
const FONT_HEADER = { name: "Calibri", size: 12, bold: true };
const FONT_TITLE = { name: "Calibri", size: 16, bold: true };

const DKK_FMT = '#,##0 "kr"';
const PROMILLE_FMT = '#,##0 "‰"';

type ExcelJSModule = typeof import("exceljs");
let excelJsPromise: Promise<ExcelJSModule> | null = null;

async function loadExcelJS(): Promise<ExcelJSModule> {
  if (!excelJsPromise) {
    excelJsPromise = import("exceljs");
  }
  return excelJsPromise;
}

function sectionHeader(ws: Worksheet, row: number, label: string): void {
  ws.mergeCells(row, 1, row, 2);
  const cell = ws.getCell(row, 1);
  cell.value = label;
  cell.font = { ...FONT_HEADER, color: { argb: COLOR.white } };
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: COLOR.accent },
  };
  cell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(row).height = 22;
}

function labelRow(
  ws: Worksheet,
  row: number,
  label: string,
  value: string | number,
  opts: { bold?: boolean; numFmt?: string; zebra?: boolean; topBorder?: boolean } = {},
): void {
  const labelCell = ws.getCell(row, 1);
  labelCell.value = label;
  labelCell.font = opts.bold ? FONT_BOLD : FONT_BODY;

  const valueCell = ws.getCell(row, 2);
  valueCell.value = value;
  valueCell.font = opts.bold ? FONT_BOLD : FONT_BODY;
  if (opts.numFmt) valueCell.numFmt = opts.numFmt;
  valueCell.alignment = { horizontal: "right" };

  if (opts.zebra) {
    const fill = {
      type: "pattern" as const,
      pattern: "solid" as const,
      fgColor: { argb: COLOR.zebraFill },
    };
    labelCell.fill = fill;
    valueCell.fill = fill;
  }

  if (opts.topBorder) {
    const border = { top: { style: "thin" as const, color: { argb: COLOR.accent } } };
    labelCell.border = border;
    valueCell.border = border;
  }
}

export async function buildCostsWorkbook(
  inputs: CostInputs,
  annual: AnnualCostBreakdown,
  oneTime: OneTimeCostBreakdown,
): Promise<Workbook> {
  const ExcelJSNs = await loadExcelJS();
  const ExcelJS = (ExcelJSNs as unknown as { default?: ExcelJSModule }).default ?? ExcelJSNs;

  const wb = new ExcelJS.Workbook();
  wb.creator = "HusKlar";
  wb.created = new Date();
  wb.title = "HusKlar Omkostninger";

  const ws = wb.addWorksheet("Omkostninger", {
    properties: { defaultRowHeight: 18 },
    pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true },
  });

  ws.getColumn(1).width = 38;
  ws.getColumn(2).width = 20;

  // Title
  ws.mergeCells("A1:B1");
  const title = ws.getCell("A1");
  title.value = "HUSKLAR OMKOSTNINGER";
  title.font = { ...FONT_TITLE, color: { argb: COLOR.text } };
  ws.getRow(1).height = 30;

  ws.mergeCells("A2:B2");
  const meta = ws.getCell("A2");
  meta.value = `Udarbejdet ${new Intl.DateTimeFormat("da-DK", { day: "numeric", month: "long", year: "numeric" }).format(new Date())}`;
  meta.font = { ...FONT_BODY, color: { argb: COLOR.muted } };

  let row = 4;

  // Section: Boligens oplysninger
  sectionHeader(ws, row, "BOLIGENS OPLYSNINGER");
  row += 1;

  const colHeaderFill = {
    type: "pattern" as const,
    pattern: "solid" as const,
    fgColor: { argb: COLOR.headerFill },
  };
  ws.getCell(row, 1).value = "Post";
  ws.getCell(row, 2).value = "Værdi";
  for (const c of [ws.getCell(row, 1), ws.getCell(row, 2)]) {
    c.font = FONT_BOLD;
    c.fill = colHeaderFill;
    c.border = { bottom: { style: "thin", color: { argb: COLOR.border } } };
  }
  ws.getCell(row, 2).alignment = { horizontal: "right" };
  row += 1;

  labelRow(ws, row++, "Kontantpris", inputs.kontantpris, { numFmt: DKK_FMT });
  if (inputs.ejendomsvaerdi !== undefined) {
    labelRow(ws, row++, "Offentlig ejendomsværdi", inputs.ejendomsvaerdi, { numFmt: DKK_FMT, zebra: true });
  }
  if (inputs.grundvaerdi !== undefined) {
    labelRow(ws, row++, "Grundværdi", inputs.grundvaerdi, { numFmt: DKK_FMT });
  }
  labelRow(ws, row++, "Boligtype", BOLIG_TYPE_LABEL[inputs.boligType], { zebra: true });
  labelRow(ws, row++, "Boligstørrelse", `${inputs.boligStoerrelseM2} m²`);
  labelRow(ws, row++, "Byggeår", inputs.byggeaar, { zebra: true });
  labelRow(ws, row++, "Antal personer", inputs.antalPersoner);
  if (inputs.grundskyldPromille !== undefined) {
    labelRow(ws, row++, "Grundskyld-sats", inputs.grundskyldPromille, { numFmt: PROMILLE_FMT, zebra: true });
  }
  if (inputs.laanebeloeb !== undefined && inputs.laanebeloeb > 0) {
    labelRow(ws, row++, "Lånebeløb", inputs.laanebeloeb, { numFmt: DKK_FMT });
  }
  row += 1;

  // Section: Årlige ejerudgifter
  sectionHeader(ws, row, "ÅRLIGE EJERUDGIFTER");
  row += 1;

  ws.getCell(row, 1).value = "Post";
  ws.getCell(row, 2).value = "Beløb (kr/år)";
  for (const c of [ws.getCell(row, 1), ws.getCell(row, 2)]) {
    c.font = FONT_BOLD;
    c.fill = colHeaderFill;
    c.border = { bottom: { style: "thin", color: { argb: COLOR.border } } };
  }
  ws.getCell(row, 2).alignment = { horizontal: "right" };
  row += 1;

  const annualFirstRow = row;
  let zebra = false;
  const annualEntries: Array<[string, number]> = [
    ["Ejendomsværdiskat", annual.ejendomsvaerdiskat],
    ["Grundskyld", annual.grundskyld],
    ["El", annual.el],
    ["Vand", annual.vand],
    ["Varme", annual.varme],
    ["Bygningsforsikring", annual.bygningsforsikring],
    ["Vedligehold", annual.vedligehold],
  ];
  if (annual.grundejerforening > 0) {
    annualEntries.push(["Grundejer- / ejerforening", annual.grundejerforening]);
  }
  for (const [label, value] of annualEntries) {
    labelRow(ws, row++, label, value, { numFmt: DKK_FMT, zebra });
    zebra = !zebra;
  }
  const annualLastRow = row - 1;

  labelRow(ws, row, "Total pr. år", { formula: `SUM(B${annualFirstRow}:B${annualLastRow})` } as never, {
    bold: true,
    numFmt: DKK_FMT,
    topBorder: true,
  });
  const annualTotalRef = `B${row}`;
  row += 1;

  labelRow(ws, row, "Pr. måned", { formula: `${annualTotalRef}/12` } as never, {
    bold: true,
    numFmt: DKK_FMT,
  });
  row += 2;

  // Section: Engangsomkostninger
  sectionHeader(ws, row, "ENGANGSOMKOSTNINGER VED KØB");
  row += 1;

  ws.getCell(row, 1).value = "Post";
  ws.getCell(row, 2).value = "Beløb";
  for (const c of [ws.getCell(row, 1), ws.getCell(row, 2)]) {
    c.font = FONT_BOLD;
    c.fill = colHeaderFill;
    c.border = { bottom: { style: "thin", color: { argb: COLOR.border } } };
  }
  ws.getCell(row, 2).alignment = { horizontal: "right" };
  row += 1;

  const oneTimeFirstRow = row;
  zebra = false;
  const oneTimeEntries: Array<[string, number]> = [
    ["Tinglysningsafgift skøde", oneTime.tinglysningSkoede],
  ];
  if (oneTime.tinglysningPantebrev > 0) {
    oneTimeEntries.push(["Tinglysningsafgift pantebrev", oneTime.tinglysningPantebrev]);
    oneTimeEntries.push(["Vurderingsgebyr", oneTime.vurderingsgebyr]);
    oneTimeEntries.push(["Lånesagsgebyr", oneTime.laanesagsgebyr]);
    oneTimeEntries.push(["Kurtage", oneTime.kurtage]);
  }
  oneTimeEntries.push(["Advokat / berigtigelse", oneTime.advokat]);
  for (const [label, value] of oneTimeEntries) {
    labelRow(ws, row++, label, value, { numFmt: DKK_FMT, zebra });
    zebra = !zebra;
  }
  const oneTimeLastRow = row - 1;

  labelRow(ws, row, "Total engangsomkostninger", { formula: `SUM(B${oneTimeFirstRow}:B${oneTimeLastRow})` } as never, {
    bold: true,
    numFmt: DKK_FMT,
    topBorder: true,
  });
  const oneTimeTotalRef = `B${row}`;
  row += 2;

  // Section: Samlet oversigt
  sectionHeader(ws, row, "SAMLET OVERSIGT");
  row += 1;

  labelRow(ws, row++, "Ejerudgift pr. år", { formula: annualTotalRef } as never, {
    numFmt: DKK_FMT,
  });
  labelRow(ws, row++, "Ejerudgift pr. måned", { formula: `${annualTotalRef}/12` } as never, {
    numFmt: DKK_FMT,
  });
  labelRow(ws, row++, "Engangsomkostninger ved køb", { formula: oneTimeTotalRef } as never, {
    numFmt: DKK_FMT,
  });
  labelRow(
    ws,
    row,
    "Første års samlede udgift",
    { formula: `${annualTotalRef}+${oneTimeTotalRef}` } as never,
    {
      bold: true,
      numFmt: DKK_FMT,
      topBorder: true,
    },
  );

  return wb;
}

export async function downloadCostsXlsx(
  inputs: CostInputs,
  annual: AnnualCostBreakdown,
  oneTime: OneTimeCostBreakdown,
): Promise<void> {
  const wb = await buildCostsWorkbook(inputs, annual, oneTime);
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const iso = new Date().toISOString().slice(0, 10);
  const a = document.createElement("a");
  a.href = url;
  a.download = `husklar-omkostninger-${iso}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
