import type { MapBounds, MapProvider, MapProviderMarker, MapProviderParameters } from '../../schemas.js';

interface GoogleMapsClass {
	new (container: HTMLElement, options: google.maps.MapOptions): google.maps.Map;
}

interface GoogleMapsMarkerClass {
	new (options: google.maps.marker.AdvancedMarkerElementOptions): google.maps.marker.AdvancedMarkerElement;
}

export class GoogleMapsProvider implements MapProvider {
	public static Parameters: MapProviderParameters = {
		mapSize: 256,
		zoomMin: 0,
		zoomMax: 22,
		zoomScale: 10
	};

	public parameters: MapProviderParameters = GoogleMapsProvider.Parameters;

	private MapClass: GoogleMapsClass;
	private MapMarkerClass: GoogleMapsMarkerClass;
	private map: google.maps.Map;

	constructor(mapClass: GoogleMapsClass, mapMarkerClass: GoogleMapsMarkerClass, container: HTMLElement, options: google.maps.MapOptions) {
		this.MapClass = mapClass;
		this.MapMarkerClass = mapMarkerClass;

		this.map = new this.MapClass(container, {
			...options
		});
	}

	public getMap(): google.maps.Map {
		return this.map;
	}

	public getContainer(): HTMLElement {
		return this.map.getDiv();
	}

	public getZoom(): number {
		return this.map.getZoom() ?? NaN;
	}

	public getBounds(): MapBounds {
		const bounds = this.map.getBounds();
		if (bounds == undefined) return { sw: { lat: NaN, lng: NaN }, ne: { lat: NaN, lng: NaN } };

		const sw = bounds.getSouthWest();
		const ne = bounds.getNorthEast();
		return { sw: { lat: sw.lat(), lng: sw.lng() }, ne: { lat: ne.lat(), lng: ne.lng() } };
	}

	public panBy(x: number, y: number) {
		this.map.panBy(x, y);
	}

	public createMarker(element: HTMLElement, lat: number, lng: number, zIndex: number): MapProviderMarker {
		const marker = new this.MapMarkerClass({ position: { lat, lng }, content: element, zIndex });
		return {
			instance: marker,
			inserted: () => marker.map != undefined && marker.map == this.map,
			insert: () => (marker.map = this.map),
			remove: () => (marker.map = undefined),
			update: (zIndex: number) => (marker.zIndex = zIndex)
		};
	}
}
