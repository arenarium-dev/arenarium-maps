import type { MapStyle, MapBounds, MapCoordinate, EventId, EventHandler, EventPayloadMap, MapPopup } from './schemas.js';

export namespace MapComponent {
	export type MapPopupContentCallback = (id: string) => Promise<HTMLElement>;
}

export interface MapComponent {
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

	updatePopups: (popups: MapPopup[]) => Promise<void>;
	removePopups: () => void;
	revealPopup: (id: string) => MapPopup | undefined;

	on: <E extends EventId>(eventId: E, handler: EventHandler<E>) => void;
	off: <E extends EventId>(eventId: E, handler: EventHandler<E>) => void;
	emit: <E extends EventId>(eventId: E, payload: EventPayloadMap[E]) => void;
}
