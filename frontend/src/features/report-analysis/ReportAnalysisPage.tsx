import { useState } from "react";
import { getAccessCode } from "@/core/utils/apiClient";
import { useDocumentTitle } from "@/core/hooks/useDocumentTitle";
import { useMetaDescription } from "@/core/hooks/useMetaDescription";
import { AccessCodeForm } from "./presentation/components/AccessCodeForm";
import { PdfUploader } from "./presentation/components/PdfUploader";
import { AnalysisResult } from "./presentation/components/AnalysisResult";
import { useUploadReport } from "./presentation/hooks/useUploadReport";

export function ReportAnalysisPage() {
  useDocumentTitle("Rapport-analyse");
  useMetaDescription(
    "Upload din tilstandsrapport eller elrapport og få en AI-drevet analyse. Kritiske fejl, omkostningsestimater og forklaringer i et sprog du forstår.",
  );
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => getAccessCode() !== null,
  );
  const { mutate, data, isPending, error } = useUploadReport();

  return (
    <article className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-semibold">Rapport-analyse</h1>
        <p className="mt-2 text-muted-foreground">
          Upload din tilstandsrapport eller elrapport. AI analyserer indholdet
          og forklarer det i et sprog du forstår.
        </p>
      </header>

      {!isAuthenticated ? (
        <AccessCodeForm onAuthenticated={() => setIsAuthenticated(true)} />
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          <section aria-label="Upload af rapport">
            <PdfUploader
              onUpload={(file, type) => mutate({ file, type })}
              isLoading={isPending}
            />
            {error && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4"
              >
                <p className="text-sm text-destructive">{error.message}</p>
              </div>
            )}
          </section>
          <section aria-label="Analyseresultat">
            {isPending && <AnalysisSkeleton />}
            {data && !isPending && <AnalysisResult analysis={data} />}
            {!data && !isPending && (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border p-12">
                <p className="text-center text-sm text-muted-foreground">
                  Upload en rapport for at se analysen her.
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </article>
  );
}

function AnalysisSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4">
      <div className="h-40 rounded-xl bg-muted" />
      <div className="h-24 rounded-xl bg-muted" />
      <div className="h-24 rounded-xl bg-muted" />
      <p className="text-center text-sm text-muted-foreground">
        Analyserer rapport... dette tager 5-15 sekunder.
      </p>
    </div>
  );
}
