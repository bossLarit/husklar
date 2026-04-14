import { useState } from "react";
import { useDocumentTitle } from "@/core/hooks/useDocumentTitle";
import { AddressSearch } from "./presentation/components/AddressSearch";
import { AreaScoreCard } from "./presentation/components/AreaScoreCard";
import { PoiList } from "./presentation/components/PoiList";
import { AreaMap } from "./presentation/components/AreaMap";
import { SurroundingsLoadingState } from "./presentation/components/SurroundingsLoadingState";
import { useOmgivelser } from "./presentation/hooks/useOmgivelser";

export function SurroundingsPage() {
  useDocumentTitle("Omgivelsesanalyse");
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const { data, isFetching, error } = useOmgivelser(selectedAddress);

  const hasSearched = selectedAddress !== null;
  const isLoading = hasSearched && isFetching && !data;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold">Omgivelsesanalyse</h1>
        <p className="mt-2 text-muted-foreground">
          Indtast en adresse og se skoler, transport og tryghed i området.
        </p>
      </div>

      <AddressSearch onSelect={setSelectedAddress} />

      {isLoading && <SurroundingsLoadingState />}

      {error && !isLoading && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <h3 className="font-semibold text-destructive">Kunne ikke hente data</h3>
          <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
          <button
            type="button"
            onClick={() => setSelectedAddress(selectedAddress)}
            className="mt-3 cursor-pointer text-sm font-medium text-primary underline"
          >
            Prøv igen
          </button>
        </div>
      )}

      {data && !isLoading && (
        <div className="flex flex-col gap-6">
          <AreaMap data={data} />
          <div className="grid gap-6 md:grid-cols-2">
            <AreaScoreCard scores={data.scores} />
            <PoiList
              schools={data.schools}
              transport={data.transport}
              availability={data.availability}
            />
          </div>
        </div>
      )}

      {!hasSearched && (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-border p-12">
          <p className="text-sm text-muted-foreground">
            Søg efter en adresse for at se omgivelserne.
          </p>
        </div>
      )}
    </div>
  );
}
