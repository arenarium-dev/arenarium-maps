import type { MapStyle } from './input.js';

import type { Types } from '@workspace/shared/src/types.js';

export namespace MapComponent {
	export interface Position {
		lat: number;
		lng: number;
		zoom: number;
	}

	export interface Bounds {
		sw: { lat: number; lng: number };
		ne: { lat: number; lng: number };
	}

	export type PopupContentCallback = (ids: string) => Promise<string>;
	export type SetPopupsContentCallbackFunction = (callback: PopupContentCallback) => void;
	export type SetPopupsFunction = (popups: Types.Popup[]) => void;
}

export interface MapComponent {
	getCenter: () => { lat: number; lng: number };
	setCenter: (lat: number, lng: number) => void;
	getZoom: () => number;
	setZoom: (zoom: number) => void;
	getBounds: () => MapComponent.Bounds;
	zoomIn: () => void;
	zoomOut: () => void;
	getStyle: () => MapStyle;
	setStyle: (style: MapStyle) => void;
	setPopupsContentCallback: (callback: MapComponent.PopupContentCallback) => void;
	setPopups: (popups: Types.Popup[]) => Promise<void>;
}
