import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { apiSurroundingsRepository } from "../../infrastructure/repositories/apiSurroundingsRepository";

export function useAddressAutocomplete() {
  const [query, setQuery] = useState("");

  const { data: suggestions = [], isFetching } = useQuery({
    queryKey: ["address-autocomplete", query],
    queryFn: () => apiSurroundingsRepository.autocomplete(query),
    enabled: query.length >= 2,
    staleTime: 30_000,
  });

  return { query, setQuery, suggestions, isFetching };
}
