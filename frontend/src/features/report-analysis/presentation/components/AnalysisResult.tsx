import type { ReportAnalysis } from "../../domain/entities/report";
import { formatDKK } from "@/core/utils/formatCurrency";
import { RiskBadge } from "./RiskBadge";
import { useDownloadReport } from "../hooks/useDownloadReport";

interface AnalysisResultProps {
  analysis: ReportAnalysis;
}

export function AnalysisResult({ analysis }: AnalysisResultProps) {
  const { downloadReport, isGenerating, error } = useDownloadReport();

  return (
    <div className="flex flex-col gap-6">
      {/* Overall summary */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Samlet vurdering</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {analysis.summary}
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <RiskBadge level={analysis.overallRisk} size="lg" />
            <button
              type="button"
              onClick={() => downloadReport(analysis)}
              disabled={isGenerating}
              aria-label="Download rapport som PDF"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGenerating ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="opacity-25"
                    />
                    <path
                      d="M12 2a10 10 0 0 1 10 10"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                  Genererer…
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download PDF
                </>
              )}
            </button>
            {error && (
              <p className="text-xs text-risk-red" role="alert">
                Kunne ikke generere PDF
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 flex gap-6 border-t border-border pt-4">
          <div>
            <p className="text-xs text-muted-foreground">
              Estimeret omkostning
            </p>
            <p className="text-lg font-semibold">
              {formatDKK(analysis.totalCostLow)} –{" "}
              {formatDKK(analysis.totalCostHigh)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Antal fund</p>
            <p className="text-lg font-semibold">{analysis.riskItems.length}</p>
          </div>
        </div>
      </div>

      {/* Individual findings */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Fund i rapporten</h2>
        {analysis.riskItems.map((item, index) => (
          <div
            key={index}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{item.category}</span>
                  <RiskBadge level={item.risk} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.finding}
                </p>
                <div className="mt-3 rounded-lg bg-secondary/50 p-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Hvad betyder det?
                  </p>
                  <p className="mt-1 text-sm">{item.plainExplanation}</p>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
              <span>Estimeret udbedring:</span>
              <span className="font-medium text-foreground">
                {formatDKK(item.estimatedCostLow)} –{" "}
                {formatDKK(item.estimatedCostHigh)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="rounded-xl border border-border bg-secondary/30 p-4">
        <p className="text-xs text-muted-foreground">
          Prisestimaterne er vejledende og baseret på typiske danske
          håndværkerpriser (2024-niveau inkl. moms). De faktiske omkostninger
          afhænger af husets størrelse, beliggenhed og den valgte håndværker.
          Få altid konkrete tilbud fra mindst to håndværkere før du budgetterer.
        </p>
      </div>
    </div>
  );
}
