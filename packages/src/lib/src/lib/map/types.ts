import type { MapStyle, MapBounds, MapCoordinate, EventId, EventHandler, EventPayloadMap } from './input.js';

import type { Types } from '@workspace/shared/src/types.js';

export namespace MapComponent {
	export type MapPopupContentCallback = (id: string) => Promise<HTMLElement>;
}

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

	updatePopupsContentCallback: (callback: MapComponent.MapPopupContentCallback) => Promise<HTMLElement>;
	updatePopups: (popups: Types.Popup[]) => Promise<void>;
	removePopups: () => void;

	on: <E extends EventId>(eventId: E, handler: EventHandler<E>) => void;
	off: <E extends EventId>(eventId: E, handler: EventHandler<E>) => void;
	emit: <E extends EventId>(eventId: E, payload: EventPayloadMap[E]) => void;
}
