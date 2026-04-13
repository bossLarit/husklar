import type { ReportAnalysis, ReportType } from "../entities/report";

export interface ReportRepository {
  upload(file: File, type: ReportType): Promise<ReportAnalysis>;
  getById(id: string): Promise<ReportAnalysis>;
}
