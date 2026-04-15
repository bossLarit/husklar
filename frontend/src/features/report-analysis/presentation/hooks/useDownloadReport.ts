import { useCallback, useState } from "react";
import type { ReportAnalysis } from "../../domain/entities/report";
import {
  buildReportFileName,
  buildReportPdfDocDefinition,
} from "../components/AnalysisReportPdf";

type PdfMakeModule = typeof import("pdfmake/build/pdfmake");

let pdfMakePromise: Promise<PdfMakeModule> | null = null;

async function loadPdfMake(): Promise<PdfMakeModule> {
  if (!pdfMakePromise) {
    pdfMakePromise = (async () => {
      const [pdfMakeModule, vfsFontsModule] = await Promise.all([
        import("pdfmake/build/pdfmake"),
        import("pdfmake/build/vfs_fonts"),
      ]);
      const pdfMake = (pdfMakeModule.default ?? pdfMakeModule) as PdfMakeModule;
      const vfs = (vfsFontsModule as unknown as { default?: unknown }).default ?? vfsFontsModule;
      pdfMake.addVirtualFileSystem(vfs as Parameters<PdfMakeModule["addVirtualFileSystem"]>[0]);
      return pdfMake;
    })();
  }
  return pdfMakePromise;
}

export function useDownloadReport() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const downloadReport = useCallback(async (analysis: ReportAnalysis) => {
    setIsGenerating(true);
    setError(null);
    try {
      const pdfMake = await loadPdfMake();
      const doc = buildReportPdfDocDefinition(analysis);
      pdfMake.createPdf(doc).download(buildReportFileName(analysis));
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Kunne ikke generere PDF"));
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { downloadReport, isGenerating, error };
}
