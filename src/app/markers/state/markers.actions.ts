import { MarkerChanges, MarkerPosition, NewMarker } from '../models/marker.model';

export class AddMarker {
  static readonly type = '[Markers] Add Marker';
  constructor(public readonly marker: NewMarker) {}
}

export class UpdateMarker {
  static readonly type = '[Markers] Update Marker';
  constructor(
    public readonly id: string,
    public readonly changes: MarkerChanges,
  ) {}
}

export class DeleteMarker {
  static readonly type = '[Markers] Delete Marker';
  constructor(public readonly id: string) {}
}

export class SelectMarker {
  static readonly type = '[Markers] Select Marker';
  constructor(public readonly id: string | null) {}
}

export class SetDraftPosition {
  static readonly type = '[Markers] Set Draft Position';
  constructor(public readonly position: MarkerPosition | null) {}
}

export class SetNewMarkerPosition {
  static readonly type = '[Markers] Set New Marker Position';
  constructor(public readonly position: MarkerPosition | null) {}
}
