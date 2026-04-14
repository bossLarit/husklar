const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function validatePdf(file: File): string | null {
  if (file.type !== "application/pdf") {
    return "Kun PDF-filer er tilladt.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "Filen er for stor. Maksimum er 10 MB.";
  }
  return null;
}
