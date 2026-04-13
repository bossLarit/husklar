import type { SurroundingsResult } from "../entities/surroundings";

export interface SurroundingsRepository {
  getByAddress(address: string): Promise<SurroundingsResult>;
  autocomplete(query: string): Promise<string[]>;
}
