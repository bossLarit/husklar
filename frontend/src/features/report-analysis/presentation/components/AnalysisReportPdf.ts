import type { Content, ContentTable, TDocumentDefinitions } from "pdfmake/interfaces";
import type {
  ReportAnalysis,
  RiskItem,
  RiskLevel,
} from "../../domain/entities/report";
import { formatDKK } from "@/core/utils/formatCurrency";

const PALETTE = {
  accent: "#0d9488",
  text: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  surfaceMuted: "#f8fafc",
  white: "#ffffff",
} as const;

const RISK_STYLE: Record<RiskLevel, { label: string; fill: string; text: string }> = {
  green: { label: "Lav risiko", fill: "#16a34a", text: "#ffffff" },
  yellow: { label: "Moderat risiko", fill: "#ca8a04", text: "#ffffff" },
  red: { label: "Høj risiko", fill: "#dc2626", text: "#ffffff" },
};

const REPORT_TYPE_LABEL: Record<ReportAnalysis["type"], string> = {
  tilstandsrapport: "Tilstandsrapport",
  elrapport: "Elrapport",
};

const dateFormatter = new Intl.DateTimeFormat("da-DK", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : dateFormatter.format(d);
}

function riskBadge(level: RiskLevel): ContentTable {
  const style = RISK_STYLE[level];
  return {
    table: {
      widths: ["auto"],
      body: [
        [
          {
            text: style.label,
            color: style.text,
            fillColor: style.fill,
            bold: true,
            fontSize: 9,
            margin: [8, 3, 8, 3],
            alignment: "center",
          },
        ],
      ],
    },
    layout: {
      defaultBorder: false,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
  };
}

function summaryCard(analysis: ReportAnalysis): Content {
  return {
    margin: [0, 0, 0, 16],
    table: {
      widths: ["*"],
      body: [
        [
          {
            fillColor: PALETTE.white,
            margin: [16, 14, 16, 14],
            stack: [
              {
                columns: [
                  {
                    width: "*",
                    text: "Samlet vurdering",
                    fontSize: 13,
                    bold: true,
                    color: PALETTE.text,
                  },
                  { width: "auto", stack: [riskBadge(analysis.overallRisk)] },
                ],
              },
              {
                text: analysis.summary,
                margin: [0, 8, 0, 0],
                fontSize: 10,
                color: PALETTE.muted,
                lineHeight: 1.35,
              },
              {
                canvas: [
                  {
                    type: "line",
                    x1: 0,
                    y1: 0,
                    x2: 515,
                    y2: 0,
                    lineWidth: 0.5,
                    lineColor: PALETTE.border,
                  },
                ],
                margin: [0, 12, 0, 0],
              },
              {
                columns: [
                  {
                    width: "*",
                    stack: [
                      {
                        text: "Samlet prisestimat",
                        fontSize: 8,
                        color: PALETTE.muted,
                      },
                      {
                        text: `${formatDKK(analysis.totalCostLow)} – ${formatDKK(analysis.totalCostHigh)}`,
                        fontSize: 13,
                        bold: true,
                        color: PALETTE.text,
                        margin: [0, 2, 0, 0],
                      },
                    ],
                  },
                  {
                    width: "auto",
                    stack: [
                      {
                        text: "Antal fund",
                        fontSize: 8,
                        color: PALETTE.muted,
                        alignment: "right",
                      },
                      {
                        text: String(analysis.riskItems.length),
                        fontSize: 13,
                        bold: true,
                        color: PALETTE.text,
                        alignment: "right",
                        margin: [0, 2, 0, 0],
                      },
                    ],
                  },
                ],
                margin: [0, 10, 0, 0],
              },
            ],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => PALETTE.border,
      vLineColor: () => PALETTE.border,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
  };
}

function findingCard(item: RiskItem, index: number): Content {
  return {
    margin: [0, 0, 0, 10],
    unbreakable: true,
    table: {
      widths: ["*"],
      body: [
        [
          {
            fillColor: PALETTE.white,
            margin: [14, 12, 14, 12],
            stack: [
              {
                columns: [
                  {
                    width: "*",
                    text: `${index + 1}. ${item.category}`,
                    fontSize: 11,
                    bold: true,
                    color: PALETTE.text,
                  },
                  { width: "auto", stack: [riskBadge(item.risk)] },
                ],
              },
              {
                text: [
                  { text: "Fund: ", bold: true, color: PALETTE.text },
                  { text: item.finding, color: PALETTE.text },
                ],
                fontSize: 10,
                margin: [0, 8, 0, 0],
                lineHeight: 1.35,
              },
              {
                margin: [0, 8, 0, 0],
                table: {
                  widths: ["*"],
                  body: [
                    [
                      {
                        fillColor: PALETTE.surfaceMuted,
                        margin: [10, 8, 10, 8],
                        stack: [
                          {
                            text: "Hvad betyder det?",
                            fontSize: 8,
                            bold: true,
                            color: PALETTE.muted,
                          },
                          {
                            text: item.plainExplanation,
                            fontSize: 10,
                            color: PALETTE.text,
                            margin: [0, 3, 0, 0],
                            lineHeight: 1.35,
                          },
                        ],
                      },
                    ],
                  ],
                },
                layout: {
                  defaultBorder: false,
                  paddingLeft: () => 0,
                  paddingRight: () => 0,
                  paddingTop: () => 0,
                  paddingBottom: () => 0,
                },
              },
              {
                text: [
                  {
                    text: "Estimeret udbedring: ",
                    fontSize: 10,
                    color: PALETTE.muted,
                  },
                  {
                    text: `${formatDKK(item.estimatedCostLow)} – ${formatDKK(item.estimatedCostHigh)}`,
                    fontSize: 10,
                    bold: true,
                    color: PALETTE.accent,
                  },
                ],
                margin: [0, 10, 0, 0],
              },
            ],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => PALETTE.border,
      vLineColor: () => PALETTE.border,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
  };
}

export function buildReportPdfDocDefinition(
  analysis: ReportAnalysis,
): TDocumentDefinitions {
  const typeLabel = REPORT_TYPE_LABEL[analysis.type];
  const createdAtLabel = formatDate(analysis.createdAt);

  return {
    pageSize: "A4",
    pageMargins: [40, 70, 40, 70],

    info: {
      title: `HusKlar Rapportanalyse – ${typeLabel}`,
      author: "HusKlar",
      subject: `Rapportanalyse af ${typeLabel}`,
    },

    header: (currentPage) => {
      if (currentPage === 1) return null as unknown as Content;
      return {
        margin: [40, 24, 40, 0],
        stack: [
          {
            columns: [
              {
                width: "*",
                text: "HUSKLAR",
                fontSize: 10,
                bold: true,
                color: PALETTE.accent,
                characterSpacing: 1.5,
              },
              {
                width: "auto",
                text: `Rapportanalyse · ${typeLabel}`,
                fontSize: 9,
                color: PALETTE.muted,
                alignment: "right",
              },
            ],
          },
          {
            canvas: [
              {
                type: "line",
                x1: 0,
                y1: 4,
                x2: 515,
                y2: 4,
                lineWidth: 0.5,
                lineColor: PALETTE.border,
              },
            ],
          },
        ],
      };
    },

    footer: (currentPage, pageCount) => ({
      margin: [40, 0, 40, 20],
      columns: [
        {
          width: "*",
          text: "HusKlar · Rapportanalyse",
          fontSize: 8,
          color: PALETTE.muted,
        },
        {
          width: "auto",
          text: `Side ${currentPage} af ${pageCount}`,
          fontSize: 8,
          color: PALETTE.muted,
          alignment: "right",
        },
      ],
    }),

    content: [
      {
        columns: [
          {
            width: "*",
            text: "HUSKLAR",
            fontSize: 11,
            bold: true,
            color: PALETTE.accent,
            characterSpacing: 1.5,
          },
          {
            width: "auto",
            text: createdAtLabel,
            fontSize: 9,
            color: PALETTE.muted,
            alignment: "right",
          },
        ],
      },
      {
        canvas: [
          {
            type: "line",
            x1: 0,
            y1: 0,
            x2: 515,
            y2: 0,
            lineWidth: 0.5,
            lineColor: PALETTE.border,
          },
        ],
        margin: [0, 6, 0, 18],
      },
      {
        text: "Rapportanalyse",
        fontSize: 22,
        bold: true,
        color: PALETTE.text,
      },
      {
        text: typeLabel,
        fontSize: 12,
        color: PALETTE.accent,
        margin: [0, 2, 0, 4],
      },
      {
        text: `Rapport-ID: ${analysis.id}`,
        fontSize: 8,
        color: PALETTE.muted,
        margin: [0, 0, 0, 18],
      },

      summaryCard(analysis),

      {
        text: "Fund i rapporten",
        fontSize: 13,
        bold: true,
        color: PALETTE.text,
        margin: [0, 6, 0, 10],
      },

      ...analysis.riskItems.map((item, i) => findingCard(item, i)),

      {
        margin: [0, 8, 0, 0],
        table: {
          widths: ["*"],
          body: [
            [
              {
                fillColor: PALETTE.surfaceMuted,
                margin: [14, 12, 14, 12],
                text: "Prisestimaterne er vejledende og baseret på typiske danske håndværkerpriser (2024-niveau inkl. moms). De faktiske omkostninger afhænger af husets størrelse, beliggenhed og den valgte håndværker. Få altid konkrete tilbud fra mindst to håndværkere før du budgetterer.",
                fontSize: 8,
                color: PALETTE.muted,
                lineHeight: 1.4,
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => PALETTE.border,
          vLineColor: () => PALETTE.border,
          paddingLeft: () => 0,
          paddingRight: () => 0,
          paddingTop: () => 0,
          paddingBottom: () => 0,
        },
      },
    ],

    defaultStyle: {
      font: "Roboto",
      fontSize: 10,
      color: PALETTE.text,
    },
  };
}

export function buildReportFileName(analysis: ReportAnalysis): string {
  const date = new Date(analysis.createdAt);
  const iso = Number.isNaN(date.getTime())
    ? new Date().toISOString().slice(0, 10)
    : date.toISOString().slice(0, 10);
  return `husklar-rapport-${analysis.type}-${iso}.pdf`;
}
