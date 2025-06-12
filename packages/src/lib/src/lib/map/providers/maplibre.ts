import type { Popup } from '@workspace/shared/src/types.js';
import type { MapProvider, MapProviderMarker, MapProviderName } from '../schemas.js';

interface MapLibreClass {
	new (options: maplibregl.MapOptions): maplibregl.Map;
}

interface MapLibreMarkerClass {
	new (options: maplibregl.MarkerOptions): maplibregl.Marker;
}

export namespace MapProviders {
	export class MapLibre implements MapProvider {
		public static Parameters: Popup.Pramaters = {
			mapSize: 512,
			zoomMin: 0,
			zoomMax: 24,
			zoomScale: 10
		};

		public name: MapProviderName = 'maplibre';
		public parameters: Popup.Pramaters = MapLibre.Parameters;

		private MapClass: MapLibreClass;
		private MapMarkerClass: MapLibreMarkerClass;
		private map: maplibregl.Map;

		constructor(mapClass: MapLibreClass, mapMarkerClass: MapLibreMarkerClass, options: maplibregl.MapOptions) {
			this.MapClass = mapClass;
			this.MapMarkerClass = mapMarkerClass;

			this.map = new this.MapClass({
				...options,
				pitchWithRotate: false,
				attributionControl: { customAttribution: '@arenarium/maps' }
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

		public getWidth(): number {
			return this.map.getCanvas().width;
		}

		public getHeight(): number {
			return this.map.getCanvas().height;
		}

		public createMarker(lat: number, lng: number, element: HTMLElement): MapProviderMarker {
			const marker = new this.MapMarkerClass({ element });
			marker.setLngLat([lng, lat]);
			return {
				instance: marker,
				inserted: () => marker._map != null,
				insert: () => marker.addTo(this.map),
				remove: () => marker.remove()
			};
		}
	}
}
