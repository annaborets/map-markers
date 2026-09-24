import { createPropertySelectors, createSelector } from '@ngxs/store';
import { MarkersState, MarkersStateModel } from './markers.state';

const slices = createPropertySelectors<MarkersStateModel>(MarkersState);

export class MarkersSelectors {
  static readonly markers = slices.markers;
  static readonly selectedId = slices.selectedId;
  static readonly newMarkerPosition = slices.newMarkerPosition;
  static readonly draftPosition = slices.draftPosition;

  static readonly selectedMarker = createSelector(
    [slices.markers, slices.selectedId],
    (markers, id) => markers.find(m => m.id === id),
  );

  static readonly displayedMarkers = createSelector(
    [slices.markers, slices.selectedId, slices.draftPosition],
    (markers, id, draft) =>
      draft ? markers.map(m => (m.id === id ? { ...m, ...draft } : m)) : markers,
  );

  static readonly displayedSelectedMarker = createSelector(
    [MarkersSelectors.displayedMarkers, slices.selectedId],
    (markers, id) => markers.find(m => m.id === id),
  );
}
