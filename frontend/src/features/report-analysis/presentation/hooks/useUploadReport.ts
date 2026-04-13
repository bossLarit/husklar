import { useMutation } from "@tanstack/react-query";
import { apiReportRepository } from "../../infrastructure/repositories/apiReportRepository";
import type { ReportAnalysis, ReportType } from "../../domain/entities/report";

interface UploadParams {
  file: File;
  type: ReportType;
}

export function useUploadReport() {
  return useMutation<ReportAnalysis, Error, UploadParams>({
    mutationFn: ({ file, type }) => apiReportRepository.upload(file, type),
  });
}
