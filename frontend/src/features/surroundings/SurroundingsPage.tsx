import { useState } from "react";
import { AddressSearch } from "./presentation/components/AddressSearch";
import { AreaScoreCard } from "./presentation/components/AreaScoreCard";
import { PoiList } from "./presentation/components/PoiList";
import { AreaMap } from "./presentation/components/AreaMap";
import { useOmgivelser } from "./presentation/hooks/useOmgivelser";

export function SurroundingsPage() {
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const { data, isPending, error } = useOmgivelser(selectedAddress);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold">Omgivelsesanalyse</h1>
        <p className="mt-2 text-muted-foreground">
          Indtast en adresse og se skoler, transport og tryghed i området.
        </p>
      </div>

      <AddressSearch onSelect={setSelectedAddress} />

      {isPending && (
        <div className="flex animate-pulse flex-col gap-4">
          <div className="h-[400px] rounded-xl bg-muted" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-48 rounded-xl bg-muted" />
            <div className="h-48 rounded-xl bg-muted" />
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{error.message}</p>
        </div>
      )}

      {data && !isPending && (
        <div className="flex flex-col gap-6">
          <AreaMap data={data} />
          <div className="grid gap-6 md:grid-cols-2">
            <AreaScoreCard scores={data.scores} />
            <PoiList schools={data.schools} transport={data.transport} />
          </div>
        </div>
      )}

      {!data && !isPending && !error && (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-border p-12">
          <p className="text-sm text-muted-foreground">
            Søg efter en adresse for at se omgivelserne.
          </p>
        </div>
      )}
    </div>
  );
}
