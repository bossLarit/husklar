import type {
  DataAvailability,
  NatureArea,
  School,
  Shop,
  TransportStop,
} from "../../domain/entities/surroundings";

interface PoiListProps {
  schools: School[];
  transport: TransportStop[];
  shops: Shop[];
  natureAreas: NatureArea[];
  availability: DataAvailability;
}

export function PoiList({
  schools,
  transport,
  shops,
  natureAreas,
  availability,
}: PoiListProps) {
  return (
    <div className="flex flex-col gap-4">
      <PoiSection
        title="Skoler & institutioner"
        items={schools}
        available={availability.schoolsAvailable}
        emptyMessage="Ingen skoler fundet inden for 5 km."
      />
      <PoiSection
        title="Offentlig transport"
        items={transport.map(({ name, type, distanceMeters }) => ({
          name,
          type,
          distanceMeters,
        }))}
        available={availability.transportAvailable}
        emptyMessage="Ingen stoppesteder fundet inden for 5 km."
      />
      <PoiSection
        title="Indkøbsmuligheder"
        items={shops}
        available={availability.shoppingAvailable}
        emptyMessage="Ingen butikker fundet inden for 5 km."
      />
      <PoiSection
        title="Naturområder"
        items={natureAreas}
        available={availability.natureAvailable}
        emptyMessage="Ingen grønne områder fundet inden for 5 km."
      />
    </div>
  );
}

interface PoiItem {
  name: string;
  type: string;
  distanceMeters: number;
}

interface PoiSectionProps {
  title: string;
  items: PoiItem[];
  available: boolean;
  emptyMessage: string;
}

function PoiSection({ title, items, available, emptyMessage }: PoiSectionProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h4 className="mb-3 text-sm font-semibold">{title}</h4>
      {!available ? (
        <p className="text-sm text-muted-foreground">
          Kunne ikke hente data lige nu. Prøv igen om lidt.
        </p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-center justify-between text-sm">
              <div>
                <span className="font-medium">{item.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {item.type}
                </span>
              </div>
              <span className="text-muted-foreground">
                {formatDistance(item.distanceMeters)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
