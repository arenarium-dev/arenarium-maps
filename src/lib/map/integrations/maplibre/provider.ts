import type { MapBounds, MapProvider, MapProviderMarker, MapProviderParameters } from '$lib/map/schemas.js';

interface MaplibreMapClass {
	new (options: maplibregl.MapOptions): maplibregl.Map;
}

interface MaplibreMarkerClass {
	new (options: maplibregl.MarkerOptions): maplibregl.Marker;
}

export class MaplibreProvider implements MapProvider {
	public static Parameters: MapProviderParameters = {
		mapSize: 512,
		zoomMin: 0,
		zoomMax: 24,
		zoomScale: 10
	};

	public parameters: MapProviderParameters = MaplibreProvider.Parameters;

	private MapClass: MaplibreMapClass;
	private MapMarkerClass: MaplibreMarkerClass;
	private map: maplibregl.Map;

	constructor(mapClass: MaplibreMapClass, mapMarkerClass: MaplibreMarkerClass, options: maplibregl.MapOptions) {
		this.MapClass = mapClass;
		this.MapMarkerClass = mapMarkerClass;

		this.map = new this.MapClass({
			...options,
			style: options.style ?? 'https://tiles.openfreemap.org/styles/liberty',
			pitchWithRotate: false,
			attributionControl: options.attributionControl ?? { compact: false, customAttribution: '@arenarium/maps' }
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

	public getMap(): maplibregl.Map {
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
