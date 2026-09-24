import { Component, computed, effect, inject, linkedSignal, untracked } from '@angular/core';
import { FormField, FormRoot, form, max, min, pattern, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Store } from '@ngxs/store';
import {
  AddMarker,
  SelectMarker,
  SetNewMarkerPosition,
  UpdateMarker,
} from '../state/markers.actions';
import { MarkersSelectors } from '../state/markers.selectors';

interface MarkerFormModel {
  name: string;
  lon: number | null;
  lat: number | null;
}

@Component({
  imports: [FormField, FormRoot, MatButtonModule, MatFormFieldModule, MatInputModule],
  selector: 'app-marker-form',
  templateUrl: './marker-form.html',
})
export class MarkerForm {
  private readonly store = inject(Store);

  private readonly newMarkerPosition = this.store.selectSignal(MarkersSelectors.newMarkerPosition);
  private readonly selectedId = this.store.selectSignal(MarkersSelectors.selectedId);
  private readonly selectedMarker = this.store.selectSignal(MarkersSelectors.selectedMarker);
  private readonly displayedMarker = this.store.selectSignal(
    MarkersSelectors.displayedSelectedMarker,
  );

  protected readonly mode = computed<'create' | 'edit' | 'idle'>(() => {
    if (this.newMarkerPosition()) {
      return 'create';
    }
    return this.selectedMarker() ? 'edit' : 'idle';
  });

  private readonly model = linkedSignal({
    source: () => ({ position: this.newMarkerPosition(), marker: this.displayedMarker() }),
    computation: ({ position, marker }, previous): MarkerFormModel => {
      if (position) return { name: '', ...position };
      if (!marker) return { name: '', lon: null, lat: null };
      const sameMarker = !previous?.source.position && previous?.source.marker?.id === marker.id;
      return { name: sameMarker ? previous.value.name : marker.name, lon: marker.lon, lat: marker.lat };
    },
  });

  protected readonly hasChanges = computed(() => {
    const saved = this.selectedMarker();
    if (this.mode() !== 'edit' || !saved) return true;
    const { name, lon, lat } = this.model();
    return name.trim() !== saved.name || lon !== saved.lon || lat !== saved.lat;
  });

  protected readonly markerForm = form(
    this.model,
    path => {
      required(path.name, { message: 'Name is required' });
      pattern(path.name, /\S/, { message: 'Name is required' });
      required(path.lon, { message: 'Longitude is required' });
      min(path.lon, -180, { message: 'Longitude must be at least -180' });
      max(path.lon, 180, { message: 'Longitude must be at most 180' });
      required(path.lat, { message: 'Latitude is required' });
      min(path.lat, -90, { message: 'Latitude must be at least -90' });
      max(path.lat, 90, { message: 'Latitude must be at most 90' });
    },
    {
      submission: {
        action: async () => {
          this.save();
        },
      },
    },
  );

  constructor() {
    effect(() => {
      this.newMarkerPosition();
      this.selectedId();
      untracked(() => this.markerForm().reset());
    });
  }

  protected cancel(): void {
    if (this.mode() === 'create') {
      this.store.dispatch(new SetNewMarkerPosition(null));
    } else {
      this.store.dispatch(new SelectMarker(null));
    }
  }

  private save(): void {
    const { lon, lat } = this.model();
    const name = this.model().name.trim();
    if (lon === null || lat === null) {
      return;
    }
    if (this.mode() === 'create') {
      this.store.dispatch(new AddMarker({ name, lon, lat }));
      return;
    }
    const selected = this.selectedMarker();
    if (selected) {
      this.store.dispatch(new UpdateMarker(selected.id, { name, lon, lat }));
      this.markerForm().reset({ name, lon, lat });
    }
  }
}
