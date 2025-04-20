import type { MapStyle, MapPopupContentCallback, MapBounds, MapCoordinate } from './input.js';

import type { Types } from '@workspace/shared/src/types.js';

export interface MapComponent {
	getCenter: () => MapCoordinate;
	setCenter: (coordinate: MapCoordinate) => void;
	getZoom: () => number;
	setZoom: (zoom: number) => void;
	getBounds: () => MapBounds;
	zoomIn: () => void;
	zoomOut: () => void;

	getStyle: () => MapStyle;
	setStyle: (style: MapStyle) => void;

	updatePopupsContentCallback: (callback: MapPopupContentCallback) => void;
	updatePopups: (popups: Types.Popup[]) => Promise<void>;
	removePopups: () => void;
}
