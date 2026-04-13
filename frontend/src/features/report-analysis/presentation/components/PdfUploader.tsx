import { useCallback, useRef, useState, type DragEvent } from "react";
import type { ReportType } from "../../domain/entities/report";

interface PdfUploaderProps {
  onUpload: (file: File, type: ReportType) => void;
  isLoading: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function PdfUploader({ onUpload, isLoading }: PdfUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [reportType, setReportType] = useState<ReportType>("tilstandsrapport");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (file.type !== "application/pdf") {
      return "Kun PDF-filer er tilladt.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "Filen er for stor. Maksimum er 10 MB.";
    }
    return null;
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        setSelectedFile(null);
        return;
      }
      setError(null);
      setSelectedFile(file);
    },
    [validateFile],
  );

  const handleDrag = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleSubmit = useCallback(() => {
    if (selectedFile) {
      onUpload(selectedFile, reportType);
    }
  }, [selectedFile, reportType, onUpload]);

  return (
    <div className="flex flex-col gap-4">
      {/* Report type selector */}
      <div className="flex gap-2">
        <TypeButton
          label="Tilstandsrapport"
          active={reportType === "tilstandsrapport"}
          onClick={() => setReportType("tilstandsrapport")}
        />
        <TypeButton
          label="Elrapport"
          active={reportType === "elrapport"}
          onClick={() => setReportType("elrapport")}
        />
      </div>

      {/* Drop zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors duration-200 ${
          dragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/40"
        }`}
      >
        <UploadIcon />
        <div>
          <p className="text-sm font-medium">
            {selectedFile
              ? selectedFile.name
              : "Træk din PDF hertil eller klik for at vælge"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            PDF, maks. 10 MB
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={handleChange}
          className="hidden"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Submit */}
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

function TypeButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors duration-150 ${
        active
          ? "bg-primary text-primary-foreground"
          : "border border-input bg-card text-muted-foreground hover:bg-secondary"
      }`}
    >
      {label}
    </button>
  );
}

function UploadIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-muted-foreground"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  );
}
