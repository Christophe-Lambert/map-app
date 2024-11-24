export interface Location {
    id?: string;
    name: string;
    lat: number;
    lng: number;
    location: {
      type: string; // typiquement "Point" pour des données GeoJSON
      coordinates: [number, number]; // [longitude, latitude]
      x?: number;
      y?: number;
    };
    timestamp?: string;
  }
  