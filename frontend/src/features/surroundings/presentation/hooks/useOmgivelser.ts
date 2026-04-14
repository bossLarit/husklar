import { useQuery } from "@tanstack/react-query";
import { apiSurroundingsRepository } from "../../infrastructure/repositories/apiSurroundingsRepository";

export function useOmgivelser(address: string | null) {
  return useQuery({
    queryKey: ["surroundings", address],
    queryFn: () => apiSurroundingsRepository.getByAddress(address!),
    enabled: !!address,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}
