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

export interface Shop {
  name: string;
  type: string;
  distanceMeters: number;
}

export interface NatureArea {
  name: string;
  type: string;
  distanceMeters: number;
}

/**
 * Municipality-level crime statistics. Coverage is annual and per-kommune,
 * NOT per-address. Always render with a "kommuneniveau" disclosure.
 */
export interface CrimeData {
  municipalityName: string;
  year: number;
  burglariesPerThousand: number;
  totalPerThousand: number;
  scope: string;
}

/**
 * Scores are null when data is unavailable (external API failed).
 * Never display a null score as a number — always "Ingen data" or similar.
 */
export interface AreaScores {
  transport: number | null;
  schools: number | null;
  shopping: number | null;
  nature: number | null;
  crime: number | null;
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
  shoppingAvailable: boolean;
  natureAvailable: boolean;
  crimeAvailable: boolean;
}

export interface SurroundingsResult {
  address: string;
  coordinates: Coordinates;
  schools: School[];
  transport: TransportStop[];
  shops: Shop[];
  natureAreas: NatureArea[];
  noiseLevel: {
    roadDb: number | null;
    railDb: number | null;
    category: string;
  };
  crime: CrimeData | null;
  scores: AreaScores;
  availability: DataAvailability;
}
