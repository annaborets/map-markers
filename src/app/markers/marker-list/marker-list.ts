import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { Store } from '@ngxs/store';
import { Marker } from '../models/marker.model';
import { CoordinatePipe } from '../pipes/coordinate.pipe';
import { DeleteMarker, SelectMarker } from '../state/markers.actions';
import { MarkersSelectors } from '../state/markers.selectors';

@Component({
  imports: [CoordinatePipe, MatButtonModule, MatDividerModule, MatIconModule, MatListModule],
  selector: 'app-marker-list',
  templateUrl: './marker-list.html',
})
export class MarkerList {
  private readonly store = inject(Store);

  protected readonly markers = this.store.selectSignal(MarkersSelectors.markers);
  protected readonly selectedId = this.store.selectSignal(MarkersSelectors.selectedId);

  protected select(marker: Marker): void {
    this.store.dispatch(new SelectMarker(marker.id));
  }

  protected remove(marker: Marker): void {
    this.store.dispatch(new DeleteMarker(marker.id));
  }
}
