import { Injectable } from '@angular/core';
import { Action, State, StateContext } from '@ngxs/store';
import { append, patch, removeItem, updateItem } from '@ngxs/store/operators';
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

export interface MarkersStateModel {
  markers: Marker[];
  selectedId: string | null;
  newMarkerPosition: MarkerPosition | null;
  draftPosition: MarkerPosition | null;
}

@State<MarkersStateModel>({
  name: 'markers',
  defaults: {
    markers: INITIAL_MARKERS,
    selectedId: null,
    newMarkerPosition: null,
    draftPosition: null,
  },
})
@Injectable()
export class MarkersState {
  @Action(AddMarker)
  addMarker(ctx: StateContext<MarkersStateModel>, { marker }: AddMarker): void {
    const id = crypto.randomUUID();
    ctx.setState(
      patch({
        markers: append([{ id, ...marker }]),
        selectedId: id,
        newMarkerPosition: null,
        draftPosition: null,
      }),
    );
  }

  @Action(UpdateMarker)
  updateMarker(ctx: StateContext<MarkersStateModel>, { id, changes }: UpdateMarker): void {
    const { selectedId, draftPosition } = ctx.getState();
    ctx.setState(
      patch({
        markers: updateItem<Marker>(m => m.id === id, patch(changes)),
        draftPosition: selectedId === id ? null : draftPosition,
      }),
    );
  }

  @Action(DeleteMarker)
  deleteMarker(ctx: StateContext<MarkersStateModel>, { id }: DeleteMarker): void {
    const { selectedId, draftPosition } = ctx.getState();
    const wasSelected = selectedId === id;
    ctx.setState(
      patch({
        markers: removeItem<Marker>(m => m.id === id),
        selectedId: wasSelected ? null : selectedId,
        draftPosition: wasSelected ? null : draftPosition,
      }),
    );
  }

  @Action(SelectMarker)
  selectMarker(ctx: StateContext<MarkersStateModel>, { id }: SelectMarker): void {
    ctx.setState(patch({ selectedId: id, newMarkerPosition: null, draftPosition: null }));
  }

  @Action(SetDraftPosition)
  setDraftPosition(ctx: StateContext<MarkersStateModel>, { position }: SetDraftPosition): void {
    ctx.setState(patch({ draftPosition: position }));
  }

  @Action(SetNewMarkerPosition)
  setNewMarkerPosition(
    ctx: StateContext<MarkersStateModel>,
    { position }: SetNewMarkerPosition,
  ): void {
    ctx.setState(patch({ newMarkerPosition: position, selectedId: null, draftPosition: null }));
  }
}
