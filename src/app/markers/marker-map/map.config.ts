import { fromLonLat } from 'ol/proj.js';
import CircleStyle from 'ol/style/Circle.js';
import Fill from 'ol/style/Fill.js';
import Stroke from 'ol/style/Stroke.js';
import Style from 'ol/style/Style.js';

export const DEFAULT_CENTER = fromLonLat([30.5238, 50.4501]);
export const DEFAULT_ZOOM = 11;

export const MARKER_STYLE = new Style({
  image: new CircleStyle({
    radius: 7,
    fill: new Fill({ color: '#3399CC' }),
    stroke: new Stroke({ color: '#fff', width: 2 }),
  }),
});

export const POPUP_OFFSET = [0, -14];
