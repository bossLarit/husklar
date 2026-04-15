import { useCallback, useState } from "react";
import type { Checklist } from "../../domain/checklistTemplate";
import {
  buildChecklistFileName,
  buildChecklistPdfDocDefinition,
} from "../../application/exportChecklistPdf";

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

export function useDownloadChecklist() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const downloadChecklist = useCallback(async (checklist: Checklist) => {
    setIsGenerating(true);
    setError(null);
    try {
      const pdfMake = await loadPdfMake();
      const doc = buildChecklistPdfDocDefinition(checklist);
      pdfMake.createPdf(doc).download(buildChecklistFileName());
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Kunne ikke generere PDF"));
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { downloadChecklist, isGenerating, error };
}
