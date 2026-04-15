import { apiPost, apiGet } from "@/core/utils/apiClient";
import type { ReportAnalysis, ReportType } from "../../domain/entities/report";

export const apiReportRepository = {
  async upload(file: File, type: ReportType): Promise<ReportAnalysis> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    // Access code is added automatically by apiClient via X-Access-Code header
    return apiPost<ReportAnalysis>("/api/reports/upload", formData);
  },

  async getById(id: string): Promise<ReportAnalysis> {
    return apiGet<ReportAnalysis>(`/api/reports/${id}`);
  },
};
