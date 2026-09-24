export interface MarkerPosition {
  lon: number;
  lat: number;
}

export interface Marker extends MarkerPosition {
  id: string;
  name: string;
}

export type NewMarker = Omit<Marker, 'id'>;
export type MarkerChanges = Partial<NewMarker>;
