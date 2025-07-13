import type { MapBounds, MapProvider, MapProviderMarker, MapProviderParameters } from '../../schemas.js';

import type { Map, MapOptions, Marker, MarkerOptions } from 'mapbox-gl';

interface MapboxMapClass {
	new (options: MapOptions): Map;
}

interface MapboxMarkerClass {
	new (options: MarkerOptions): Marker;
}

export class MapboxProvider implements MapProvider {
	public static Parameters: MapProviderParameters = {
		mapSize: 512,
		zoomMin: 0,
		zoomMax: 24,
		zoomScale: 10
	};

	public parameters: MapProviderParameters = MapboxProvider.Parameters;

	private MapClass: MapboxMapClass;
	private MapMarkerClass: MapboxMarkerClass;
	private map: Map;

	constructor(mapClass: MapboxMapClass, mapMarkerClass: MapboxMarkerClass, options: MapOptions) {
		this.MapClass = mapClass;
		this.MapMarkerClass = mapMarkerClass;

		this.map = new this.MapClass({
			...options,
			projection: 'mercator',
			pitchWithRotate: false,
			customAttribution: options.customAttribution ?? '@arenarium/maps'
		});
		// Disable map rotation using right click + drag
		this.map.dragRotate.disable();
		// Disable map rotation using keyboard
		this.map.keyboard.disable();
		// Disable map rotation using touch rotation gesture
		this.map.touchZoomRotate.disableRotation();
		// Disable map pitch using touch pitch gesture
		this.map.touchPitch.disable();
	}

	public getMap(): Map {
		return this.map;
	}

	public getContainer(): HTMLElement {
		return this.map.getContainer();
	}

	public getZoom(): number {
		return this.map.getZoom();
	}

	public getBounds(): MapBounds {
		const bounds = this.map.getBounds();
		if (!bounds) return { sw: { lat: 0, lng: 0 }, ne: { lat: 0, lng: 0 } };

		const sw = bounds.getSouthWest();
		const ne = bounds.getNorthEast();
		return { sw, ne };
	}

	public panBy(x: number, y: number) {
		this.map.panBy([x, y]);
	}

	public createMarker(element: HTMLElement, lat: number, lng: number): MapProviderMarker {
		const marker = new this.MapMarkerClass({ element });
		marker.setLngLat([lng, lat]);
		return {
			instance: marker,
			inserted: () => marker._map != null,
			insert: () => marker.addTo(this.map),
			remove: () => marker.remove(),
			update: (zIndex: number) => (marker.getElement().style.zIndex = zIndex.toString())
		};
	}
}
