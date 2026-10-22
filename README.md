# map-markers

Map marker CRUD on an interactive map — Angular 22 / NGXS / OpenLayers.

A visual project overview — usage guide, architecture and design decisions — is at
https://map-markers-teal.vercel.app/docs/ (source: [`public/docs/index.html`](public/docs/index.html)).

Live app: https://map-markers-teal.vercel.app

## Prerequisites

- Node ^22.22.3 || ^24.15.0 || >=26.0.0
- npm

## Running

```sh
npm install
npm start
```

The dev server serves the app at http://localhost:4200.

To run the test suite (Vitest; covers the NGXS state and the marker form):

```sh
npm test -- --watch=false
```

To build the app for production:

```sh
npm run build
```

## Features

- View markers on the map.
- Add a marker at a selected location: click the map, then confirm the name and coordinates in the side-panel form. A bare map click never creates a marker.
- View marker info via the map popup and the side panel selection.
- Edit a marker through the name/longitude/latitude form, or by dragging the selected marker on the map; either way, changes are applied on Save.
- Delete a marker from the popup or from the list.
- Every change is reflected on the map immediately.

## Architecture

NGXS is the single source of truth. The state shape is:

```ts
{
  markers: Marker[];            // full marker collection
  selectedId: string | null;    // marker selected in the popup / side panel
  newMarkerPosition: MarkerPosition | null; // pending map-click position for creation
  draftPosition: MarkerPosition | null;     // unsaved drag position of the selected marker
}
```

Six actions mutate or drive it: `AddMarker`, `UpdateMarker`, `DeleteMarker`, `SelectMarker`, `SetNewMarkerPosition`, `SetDraftPosition`. Handlers use `@ngxs/store/operators`; `AddMarker` generates the marker id in the state. State is exposed through `MarkersSelectors`, including `displayedMarkers` / `displayedSelectedMarker`, which apply the draft position on top of the saved markers.

The map component owns OpenLayers imperatively; state and map sync in both directions:

- OpenLayers events dispatch actions: `singleclick` on the map feeds `SetNewMarkerPosition` (or `SelectMarker` when a feature is hit), and `translateend` after a drag feeds `SetDraftPosition`. Only the selected marker can be dragged; the drag is committed by the form's Save and discarded by Cancel.
- `effect()`s over `store.selectSignal(...)` push state back to the map: they reconcile the vector source by id-diff (adding, updating, removing features) and position the `ol.Overlay` popup over the selected marker.

Coordinates are stored in WGS84 (longitude/latitude degrees) and projected to EPSG:3857 only at the map boundary.

Change detection is zoneless: signal writes drive the UI, while the map canvas renders itself.

Styling uses Tailwind CSS v4 (via PostCSS) in templates, on top of the prebuilt Angular Material theme. `src/styles.css` is the only stylesheet; components have no CSS files.

## Project layout

```
src/app/markers/
├── models/marker.model.ts      # Marker, MarkerPosition, NewMarker, MarkerChanges (WGS84 lon/lat)
├── data/initial-markers.ts     # initial seed markers (in-memory mock data)
├── state/                      # NGXS actions, state, selectors, state spec
├── pipes/coordinate.pipe.ts    # coordinate formatting
├── marker-map/                 # OpenLayers map (+ map.config.ts: style, center, zoom)
├── marker-list/                # side-panel list of markers (select / delete)
└── marker-form/                # create/edit form (name, longitude, latitude)
```

## Known simplifications

- Data is an in-memory mock; there is no persistence — a page reload restores the seed set.
- Marker creation always requires form confirmation; clicking the map only pre-fills the position.
- The OpenLayers `singleclick` event has a ~250 ms delay before firing, by design of the library (it waits to rule out a double-click).
- The test suite covers the NGXS state and the marker form; the map component is not unit-tested.
