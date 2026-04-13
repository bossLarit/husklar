import type { School, TransportStop } from "../../domain/entities/surroundings";

interface PoiListProps {
  schools: School[];
  transport: TransportStop[];
}

export function PoiList({ schools, transport }: PoiListProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Schools */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h4 className="mb-3 text-sm font-semibold">Skoler & institutioner</h4>
        {schools.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ingen skoler fundet inden for 5 km.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {schools.map((school, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{school.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {school.type}
                  </span>
                </div>
                <span className="text-muted-foreground">
                  {formatDistance(school.distanceMeters)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Transport */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h4 className="mb-3 text-sm font-semibold">Offentlig transport</h4>
        {transport.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ingen stoppesteder fundet inden for 5 km.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {transport.map((stop, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="font-medium">{stop.name}</span>
                <span className="text-muted-foreground">
                  {formatDistance(stop.distanceMeters)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
