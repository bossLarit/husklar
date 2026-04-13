import { apiGet } from "@/core/utils/apiClient";
import type { SurroundingsRepository } from "../../domain/repositories/surroundingsRepository";
import type { SurroundingsResult } from "../../domain/entities/surroundings";

interface AutocompleteSuggestion {
  text: string;
  id: string;
}

export const apiSurroundingsRepository: SurroundingsRepository = {
  async getByAddress(address: string): Promise<SurroundingsResult> {
    return apiGet<SurroundingsResult>(
      `/api/surroundings?address=${encodeURIComponent(address)}`,
    );
  },

  async autocomplete(query: string): Promise<string[]> {
    const suggestions = await apiGet<AutocompleteSuggestion[]>(
      `/api/surroundings/autocomplete?q=${encodeURIComponent(query)}`,
    );
    return suggestions.map((s) => s.text);
  },
};
