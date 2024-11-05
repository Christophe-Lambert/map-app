export interface Location {
    id: string;
    name: string;
    location: {
      type: string; // typiquement "Point" pour des données GeoJSON
      coordinates: [number, number]; // [longitude, latitude]
    };
  }
  