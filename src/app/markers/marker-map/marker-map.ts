import { Component, DestroyRef, ElementRef, afterNextRender, effect, inject, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Store } from '@ngxs/store';
import Feature from 'ol/Feature.js';
import type { FeatureLike } from 'ol/Feature.js';
import Translate from 'ol/interaction/Translate.js';
import type { TranslateEvent } from 'ol/interaction/Translate.js';
import type MapBrowserEvent from 'ol/MapBrowserEvent.js';
import OlMap from 'ol/Map.js';
import Overlay from 'ol/Overlay.js';
import View from 'ol/View.js';
import Point from 'ol/geom/Point.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorLayer from 'ol/layer/Vector.js';
import { fromLonLat, toLonLat } from 'ol/proj.js';
import OSM from 'ol/source/OSM.js';
import VectorSource from 'ol/source/Vector.js';
import { CoordinatePipe } from '../pipes/coordinate.pipe';
import {
  DeleteMarker,
  SelectMarker,
  SetDraftPosition,
  SetNewMarkerPosition,
} from '../state/markers.actions';
import { MarkersSelectors } from '../state/markers.selectors';
import { DEFAULT_CENTER, DEFAULT_ZOOM, MARKER_STYLE, POPUP_OFFSET } from './map.config';

@Component({
  imports: [CoordinatePipe, MatButtonModule, MatIconModule],
  selector: 'app-marker-map',
  host: { class: 'block h-full' },
  templateUrl: './marker-map.html',
})
export class MarkerMap {
  private readonly store = inject(Store);
  protected readonly markers = this.store.selectSignal(MarkersSelectors.displayedMarkers);
  protected readonly selectedMarker = this.store.selectSignal(
    MarkersSelectors.displayedSelectedMarker,
  );
  private readonly mapTarget = viewChild.required<ElementRef<HTMLDivElement>>('mapTarget');
  private readonly popupTarget = viewChild.required<ElementRef<HTMLDivElement>>('popupTarget');

  private readonly source = new VectorSource<Feature<Point>>();
  private readonly vectorLayer = new VectorLayer({ source: this.source, style: MARKER_STYLE });
  private readonly overlay = new Overlay({
    positioning: 'bottom-center',
    offset: POPUP_OFFSET,
    autoPan: true,
  });
  private readonly translate = new Translate({
    layers: [this.vectorLayer],
    filter: feature => idOf(feature) === this.selectedMarker()?.id,
  });
  private readonly map = new OlMap({
    layers: [new TileLayer({ source: new OSM() }), this.vectorLayer],
    overlays: [this.overlay],
    view: new View({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM }),
  });

  constructor() {
    this.map.addInteraction(this.translate);
    this.map.on('singleclick', evt => this.onSingleClick(evt));
    this.translate.on('translateend', evt => this.onTranslateEnd(evt));
    effect(() => this.syncFeatures());
    effect(() => this.positionPopup());
    afterNextRender(() => {
      this.overlay.setElement(this.popupTarget().nativeElement);
      this.map.setTarget(this.mapTarget().nativeElement);
    });
    inject(DestroyRef).onDestroy(() => this.map.dispose());
  }

  protected deleteMarker(id: string): void {
    this.store.dispatch(new DeleteMarker(id));
  }

  protected closePopup(): void {
    this.store.dispatch(new SelectMarker(null));
  }

  private onSingleClick(evt: MapBrowserEvent): void {
    const hit = this.map.forEachFeatureAtPixel(evt.pixel, feature => feature, {
      layerFilter: layer => layer === this.vectorLayer,
    });
    if (hit) {
      this.store.dispatch(new SelectMarker(idOf(hit)));
      return;
    }
    const [lon, lat] = toLonLat(evt.coordinate);
    this.store.dispatch(new SetNewMarkerPosition({ lon, lat }));
  }

  private onTranslateEnd(evt: TranslateEvent): void {
    const [feature] = evt.features.getArray();
    const [lon, lat] = toLonLat((feature.getGeometry() as Point).getCoordinates());
    this.store.dispatch(new SetDraftPosition({ lon, lat }));
  }

  private syncFeatures(): void {
    this.source.clear();
    this.source.addFeatures(
      this.markers().map(m => {
        const feature = new Feature(new Point(fromLonLat([m.lon, m.lat])));
        feature.setId(m.id);
        return feature;
      }),
    );
  }

  private positionPopup(): void {
    const marker = this.selectedMarker();
    this.overlay.setPosition(marker ? fromLonLat([marker.lon, marker.lat]) : undefined);
  }
}

function idOf(feature: FeatureLike): string {
  return feature.getId() as string;
}
