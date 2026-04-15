import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import type { Checklist, ChecklistPhase } from "../domain/checklistTemplate";
import { countProgress } from "../domain/checklistTemplate";

const PALETTE = {
  accent: "#0d9488",
  text: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  surfaceMuted: "#f8fafc",
  done: "#16a34a",
} as const;

const dateFormatter = new Intl.DateTimeFormat("da-DK", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function phaseBlock(phase: ChecklistPhase): Content {
  const done = phase.items.filter((it) => it.checked).length;

  const itemRows: Content[] = phase.items.length
    ? phase.items.map((it) => {
        const box = it.checked ? "☑" : "☐";
        const labelColor = it.checked ? PALETTE.done : PALETTE.text;
        const stack: Content[] = [
          {
            columns: [
              {
                width: 14,
                text: box,
                fontSize: 12,
                color: it.checked ? PALETTE.done : PALETTE.muted,
              },
              {
                width: "*",
                text: it.label,
                fontSize: 10,
                color: labelColor,
                decoration: it.checked ? "lineThrough" : undefined,
                lineHeight: 1.35,
              },
            ],
          },
        ];
        if (it.note) {
          stack.push({
            text: it.note,
            fontSize: 9,
            italics: true,
            color: PALETTE.muted,
            margin: [18, 2, 0, 0],
            lineHeight: 1.3,
          });
        }
        return { stack, margin: [0, 3, 0, 3] };
      })
    : [
        {
          text: "(ingen punkter)",
          fontSize: 9,
          italics: true,
          color: PALETTE.muted,
        },
      ];

  return {
    margin: [0, 0, 0, 14],
    unbreakable: false,
    stack: [
      {
        columns: [
          {
            width: "*",
            stack: [
              {
                text: phase.title.toUpperCase(),
                fontSize: 11,
                bold: true,
                color: PALETTE.accent,
                characterSpacing: 0.8,
              },
              {
                text: phase.subtitle,
                fontSize: 9,
                color: PALETTE.muted,
                margin: [0, 2, 0, 0],
              },
            ],
          },
          {
            width: "auto",
            text: `${done}/${phase.items.length}`,
            fontSize: 10,
            bold: true,
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
        margin: [0, 6, 0, 8],
      },
      ...itemRows,
    ],
  };
}

export function buildChecklistPdfDocDefinition(
  checklist: Checklist,
): TDocumentDefinitions {
  const { done, total } = countProgress(checklist);

  return {
    pageSize: "A4",
    pageMargins: [40, 70, 40, 70],

    info: {
      title: "HusKlar Boligkøbs-tjekliste",
      author: "HusKlar",
      subject: "Tjekliste til boligkøb",
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
                text: "Boligkøbs-tjekliste",
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
          text: "HusKlar · Boligkøbs-tjekliste",
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
            text: dateFormatter.format(new Date()),
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
        text: "Boligkøbs-tjekliste",
        fontSize: 22,
        bold: true,
        color: PALETTE.text,
      },
      {
        text: "Fra research til nøglen i hånden",
        fontSize: 12,
        color: PALETTE.accent,
        margin: [0, 2, 0, 4],
      },
      {
        text: `Status: ${done} af ${total} punkter afkrydset`,
        fontSize: 9,
        color: PALETTE.muted,
        margin: [0, 0, 0, 20],
      },

      ...checklist.phases.map(phaseBlock),

      {
        margin: [0, 8, 0, 0],
        table: {
          widths: ["*"],
          body: [
            [
              {
                fillColor: PALETTE.surfaceMuted,
                margin: [14, 12, 14, 12],
                stack: [
                  {
                    text: "Oplysningerne er vejledende og erstatter ikke juridisk rådgivning. Kontakt en advokat for bindende rådgivning om din konkrete situation.",
                    fontSize: 8,
                    color: PALETTE.muted,
                    lineHeight: 1.4,
                  },
                  {
                    text: "Beregninger og økonomiske vurderinger erstatter ikke rådgivning fra bank eller realkreditinstitut.",
                    fontSize: 8,
                    color: PALETTE.muted,
                    margin: [0, 4, 0, 0],
                    lineHeight: 1.4,
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
      },
    ],

    defaultStyle: {
      font: "Roboto",
      fontSize: 10,
      color: PALETTE.text,
    },
  };
}

export function buildChecklistFileName(): string {
  const iso = new Date().toISOString().slice(0, 10);
  return `husklar-tjekliste-${iso}.pdf`;
}
