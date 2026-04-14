export interface Coordinates {
  lat: number;
  lng: number;
}

export interface School {
  name: string;
  type: string;
  distanceMeters: number;
}

export interface TransportStop {
  name: string;
  type: string;
  distanceMeters: number;
  lines: string[];
}

/**
 * Scores are null when data is unavailable (external API failed).
 * Never display a null score as a number — always "Ingen data" or similar.
 */
export interface AreaScores {
  transport: number | null;
  schools: number | null;
  noise: number | null;
  overall: number | null;
}

/**
 * Tracks which categories have real data loaded.
 * False = external API call failed.
 * True + empty POI list = "nothing found within range" (still valid data).
 */
export interface DataAvailability {
  schoolsAvailable: boolean;
  transportAvailable: boolean;
}

export interface SurroundingsResult {
  address: string;
  coordinates: Coordinates;
  schools: School[];
  transport: TransportStop[];
  noiseLevel: {
    roadDb: number | null;
    railDb: number | null;
    category: string;
  };
  scores: AreaScores;
  availability: DataAvailability;
}
