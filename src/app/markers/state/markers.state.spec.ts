import { TestBed } from '@angular/core/testing';
import { Store, provideStore } from '@ngxs/store';
import { beforeEach, describe, expect, it } from 'vitest';
import { INITIAL_MARKERS } from '../data/initial-markers';
import { Marker, MarkerPosition } from '../models/marker.model';
import {
  AddMarker,
  DeleteMarker,
  SelectMarker,
  SetDraftPosition,
  SetNewMarkerPosition,
  UpdateMarker,
} from './markers.actions';
import { MarkersSelectors } from './markers.selectors';
import { MarkersState } from './markers.state';

describe('MarkersState', () => {
  let store: Store;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideStore([MarkersState])] });
    store = TestBed.inject(Store);
  });

  const markers = () => store.selectSignal<Marker[]>(MarkersSelectors.markers)();
  const selectedId = () => store.selectSignal<string | null>(MarkersSelectors.selectedId)();
  const newMarkerPosition = () =>
    store.selectSignal<MarkerPosition | null>(MarkersSelectors.newMarkerPosition)();
  const selectedMarker = () =>
    store.selectSignal<Marker | undefined>(MarkersSelectors.selectedMarker)();

  it('is seeded with the initial markers and no selection', () => {
    expect(markers()).toEqual(INITIAL_MARKERS);
    expect(selectedId()).toBeNull();
    expect(newMarkerPosition()).toBeNull();
  });

  it('appends a marker with a generated id, selects it and clears the pending position', async () => {
    await store.dispatch(new SetNewMarkerPosition({ lon: 1, lat: 2 }));
    await store.dispatch(new AddMarker({ name: 'New marker', lon: 1, lat: 2 }));
    const added = markers().at(-1)!;
    expect(markers()).toHaveLength(INITIAL_MARKERS.length + 1);
    expect(added).toEqual({ id: expect.any(String), name: 'New marker', lon: 1, lat: 2 });
    expect(INITIAL_MARKERS.some(m => m.id === added.id)).toBe(false);
    expect(selectedId()).toBe(added.id);
    expect(newMarkerPosition()).toBeNull();
  });

  it('patches only the targeted marker on update', async () => {
    await store.dispatch(new UpdateMarker('maidan', { name: 'Maidan', lon: 30.52, lat: 50.45 }));
    expect(markers().find(m => m.id === 'maidan')).toEqual({
      id: 'maidan',
      name: 'Maidan',
      lon: 30.52,
      lat: 50.45,
    });
    expect(markers().find(m => m.id === 'lavra')).toEqual(INITIAL_MARKERS[1]);
  });

  it('keeps the marker array untouched when updating an unknown id', async () => {
    const before = markers();
    await store.dispatch(new UpdateMarker('missing', { name: 'Nope' }));
    expect(markers()).toBe(before);
  });

  it('moves a marker without touching its name', async () => {
    await store.dispatch(new UpdateMarker('lavra', { lon: 31, lat: 51 }));
    const moved = markers().find(m => m.id === 'lavra');
    expect(moved?.name).toBe('Kyiv-Pechersk Lavra');
    expect(moved?.lon).toBe(31);
    expect(moved?.lat).toBe(51);
  });

  it('deletes a marker and clears the selection only when it pointed at it', async () => {
    await store.dispatch(new SelectMarker('maidan'));
    await store.dispatch(new DeleteMarker('lavra'));
    expect(markers().some(m => m.id === 'lavra')).toBe(false);
    expect(selectedId()).toBe('maidan');
    await store.dispatch(new DeleteMarker('maidan'));
    expect(markers().some(m => m.id === 'maidan')).toBe(false);
    expect(selectedId()).toBeNull();
  });

  it('selects and deselects a marker', async () => {
    await store.dispatch(new SelectMarker('golden-gate'));
    expect(selectedId()).toBe('golden-gate');
    await store.dispatch(new SelectMarker(null));
    expect(selectedId()).toBeNull();
  });

  it('sets a pending position, clears the selection, and accepts null to reset', async () => {
    await store.dispatch(new SelectMarker('maidan'));
    await store.dispatch(new SetNewMarkerPosition({ lon: 30.1, lat: 50.1 }));
    expect(newMarkerPosition()).toEqual({ lon: 30.1, lat: 50.1 });
    expect(selectedId()).toBeNull();
    await store.dispatch(new SetNewMarkerPosition(null));
    expect(newMarkerPosition()).toBeNull();
  });

  it('clears the pending position when a marker is selected', async () => {
    await store.dispatch(new SetNewMarkerPosition({ lon: 30.2, lat: 50.2 }));
    await store.dispatch(new SelectMarker('maidan'));
    expect(newMarkerPosition()).toBeNull();
    expect(selectedId()).toBe('maidan');
  });

  describe('draft position', () => {
    const draftPosition = () =>
      store.selectSignal<MarkerPosition | null>(MarkersSelectors.draftPosition)();
    const displayed = () => store.selectSignal<Marker[]>(MarkersSelectors.displayedMarkers)();

    beforeEach(async () => {
      await store.dispatch(new SelectMarker('lavra'));
      await store.dispatch(new SetDraftPosition({ lon: 31, lat: 51 }));
    });

    it('shows the draft on the selected marker without changing saved markers', () => {
      expect(displayed().find(m => m.id === 'lavra')).toMatchObject({ lon: 31, lat: 51 });
      expect(markers()).toEqual(INITIAL_MARKERS);
    });

    it('is cleared by selecting, staging a new position, or saving the selected marker', async () => {
      await store.dispatch(new SelectMarker('maidan'));
      expect(draftPosition()).toBeNull();

      await store.dispatch(new SelectMarker('lavra'));
      await store.dispatch(new SetDraftPosition({ lon: 31, lat: 51 }));
      await store.dispatch(new SetNewMarkerPosition({ lon: 1, lat: 2 }));
      expect(draftPosition()).toBeNull();

      await store.dispatch(new SelectMarker('lavra'));
      await store.dispatch(new SetDraftPosition({ lon: 31, lat: 51 }));
      await store.dispatch(new UpdateMarker('lavra', { lon: 31, lat: 51 }));
      expect(draftPosition()).toBeNull();
      expect(markers().find(m => m.id === 'lavra')).toMatchObject({ lon: 31, lat: 51 });
    });

    it('is kept when another marker is updated or deleted', async () => {
      await store.dispatch(new UpdateMarker('maidan', { name: 'M' }));
      await store.dispatch(new DeleteMarker('golden-gate'));
      expect(draftPosition()).toEqual({ lon: 31, lat: 51 });
    });

    it('is cleared when the selected marker is deleted', async () => {
      await store.dispatch(new DeleteMarker('lavra'));
      expect(draftPosition()).toBeNull();
    });
  });

  it('resolves the selected marker and yields undefined for dangling ids', async () => {
    await store.dispatch(new SelectMarker('st-sophia'));
    expect(selectedMarker()?.id).toBe('st-sophia');
    await store.dispatch(new SelectMarker('missing'));
    expect(selectedMarker()).toBeUndefined();
    await store.dispatch(new SelectMarker(null));
    expect(selectedMarker()).toBeUndefined();
  });
});
