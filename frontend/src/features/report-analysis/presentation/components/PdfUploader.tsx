import { useCallback, useState } from "react";
import type { ReportType } from "../../domain/entities/report";
import { validatePdf } from "../../utils/validatePdf";
import { ReportTypeSelector } from "./ReportTypeSelector";
import { PdfDropZone } from "./PdfDropZone";

interface PdfUploaderProps {
  onUpload: (file: File, type: ReportType) => void;
  isLoading: boolean;
}

export function PdfUploader({ onUpload, isLoading }: PdfUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [reportType, setReportType] = useState<ReportType>("tilstandsrapport");
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = useCallback((file: File) => {
    const validationError = validatePdf(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }
    setError(null);
    setSelectedFile(file);
  }, []);

  const handleSubmit = useCallback(() => {
    if (selectedFile) onUpload(selectedFile, reportType);
  }, [selectedFile, reportType, onUpload]);

  return (
    <div className="flex flex-col gap-4">
      <ReportTypeSelector value={reportType} onChange={setReportType} />

      <PdfDropZone
        selectedFile={selectedFile}
        onFileSelected={handleFileSelected}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!selectedFile || isLoading}
        className="h-11 cursor-pointer rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? "Analyserer..." : "Analysér rapport"}
      </button>
    </div>
  );
}
