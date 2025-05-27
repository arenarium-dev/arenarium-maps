import type { MapStyle, MapBounds, MapCoordinate, MapPopup, MapConfiguration, EventId, EventHandler, EventPayloadMap } from './schemas.js';

import maplibregl from 'maplibre-gl';

export namespace MapComponent {
	export type MapPopupContentCallback = (id: string) => Promise<HTMLElement>;
}

export interface MapComponent {
	maplibre: () => maplibregl.Map;

	getCenter: () => MapCoordinate;
	getZoom: () => number;
	getBounds: () => MapBounds;
	setCenter: (coordinate: MapCoordinate) => void;
	setZoom: (zoom: number) => void;
	setMinZoom: (zoom: number) => void;
	setMaxZoom: (zoom: number) => void;
	setMaxBounds: (bounds: MapBounds) => void;
	zoomIn: () => void;
	zoomOut: () => void;

	getStyle: () => MapStyle;
	setStyle: (style: MapStyle) => void;

	getConfiguration: () => MapConfiguration;
	setConfiguration: (configuration: MapConfiguration) => void;

	updatePopups: (popups: MapPopup[]) => Promise<void>;
	removePopups: () => void;
	revealPopup: (id: string) => MapPopup | undefined;

	on: <E extends EventId>(eventId: E, handler: EventHandler<E>) => void;
	off: <E extends EventId>(eventId: E, handler: EventHandler<E>) => void;
	emit: <E extends EventId>(eventId: E, payload: EventPayloadMap[E]) => void;
}
