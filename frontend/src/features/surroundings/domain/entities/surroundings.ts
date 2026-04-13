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

export interface AreaScores {
  transport: number;
  schools: number;
  noise: number;
  overall: number;
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
}
