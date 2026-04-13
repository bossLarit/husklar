import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import type { SurroundingsResult } from "../../domain/entities/surroundings";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon issue with bundlers
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = defaultIcon;

interface AreaMapProps {
  data: SurroundingsResult;
}

export function AreaMap({ data }: AreaMapProps) {
  const { lat, lng } = data.coordinates;

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <MapContainer
        center={[lat, lng]}
        zoom={14}
        scrollWheelZoom={true}
        style={{ height: "400px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Address marker */}
        <Marker position={[lat, lng]}>
          <Popup>{data.address}</Popup>
        </Marker>

        {/* Walking distance circles */}
        <Circle
          center={[lat, lng]}
          radius={400}
          pathOptions={{ color: "var(--color-primary)", fillOpacity: 0.05, weight: 1 }}
        />
        <Circle
          center={[lat, lng]}
          radius={1000}
          pathOptions={{ color: "var(--color-primary)", fillOpacity: 0.03, weight: 1, dashArray: "5 5" }}
        />
      </MapContainer>
      <div className="flex gap-4 border-t border-border bg-card px-4 py-2 text-xs text-muted-foreground">
        <span>Indre cirkel: ~5 min gang (400 m)</span>
        <span>Ydre cirkel: ~12 min gang (1 km)</span>
      </div>
    </div>
  );
}
