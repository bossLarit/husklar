import { useState } from "react";
import { getAuthToken } from "@/core/utils/apiClient";
import { AccessCodeForm } from "./presentation/components/AccessCodeForm";
import { PdfUploader } from "./presentation/components/PdfUploader";
import { AnalysisResult } from "./presentation/components/AnalysisResult";
import { useUploadReport } from "./presentation/hooks/useUploadReport";

export function ReportAnalysisPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => getAuthToken() !== null,
  );
  const { mutate, data, isPending, error } = useUploadReport();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold">Rapport-analyse</h1>
        <p className="mt-2 text-muted-foreground">
          Upload din tilstandsrapport eller elrapport. AI analyserer indholdet
          og forklarer det i et sprog du forstår.
        </p>
      </div>

      {!isAuthenticated ? (
        <AccessCodeForm onAuthenticated={() => setIsAuthenticated(true)} />
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <PdfUploader
              onUpload={(file, type) => mutate({ file, type })}
              isLoading={isPending}
            />
            {error && (
              <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-sm text-destructive">{error.message}</p>
              </div>
            )}
          </div>
          <div>
            {isPending && <AnalysisSkeleton />}
            {data && !isPending && <AnalysisResult analysis={data} />}
            {!data && !isPending && (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border p-12">
                <p className="text-center text-sm text-muted-foreground">
                  Upload en rapport for at se analysen her.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
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
