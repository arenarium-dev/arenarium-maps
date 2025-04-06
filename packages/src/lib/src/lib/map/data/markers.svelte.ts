import maplibregl from 'maplibre-gl';

import MapMarker from '../../components/marker/Marker.svelte';
import MapMarkerCircle from '../../components/marker/Circle.svelte';

import type { Types } from '@workspace/shared/src/types.js';

export class MarkerData {
	marker: Types.Marker;
	libreMarker: maplibregl.Marker | undefined;

	element = $state<HTMLElement>();
	content = $state<string>();
	component = $state<ReturnType<typeof MapMarker>>();
	componentRendered = $state<boolean>(false);
	circle = $state<ReturnType<typeof MapMarkerCircle>>();
	circleRendered = $state<boolean>(false);

	constructor(marker: Types.Marker) {
		this.marker = marker;
		this.libreMarker = undefined;
		this.content = undefined;
		this.element = undefined;
		this.component = undefined;
		this.componentRendered = false;
		this.circle = undefined;
		this.circleRendered = false;
	}
}

export class BoundsPair {
	private bounds1: maplibregl.LngLatBounds;
	private bounds2: maplibregl.LngLatBounds;

	constructor(map: maplibregl.Map, swX: number, swY: number, neX: number, neY: number) {
		const sw = map.unproject([swX, swY]);
		const ne = map.unproject([neX, neY]);

		if (sw.lng < -180) {
			// Left
			this.bounds1 = this.getBounds(-180, sw.lat, ne.lng, ne.lat);
			// Right
			this.bounds2 = this.getBounds(sw.wrap().lng, sw.lat, 180, ne.lat);
			return;
		}

		if (ne.lng > 180) {
			// Left
			this.bounds1 = this.getBounds(sw.lng, sw.lat, 180, ne.lat);
			// Right
			this.bounds2 = this.getBounds(-180, sw.lat, ne.wrap().lng, ne.lat);
			return;
		}

		// All
		this.bounds1 = this.getBounds(sw.lng, sw.lat, ne.lng, ne.lat);
		// None
		this.bounds2 = this.getBounds(0, 0, 0, 0);
	}

	private getBounds = (swLng: number, swLat: number, neLng: number, neLat: number) => {
		return new maplibregl.LngLatBounds([swLng, swLat], [neLng, neLat]);
	};

	public contains = (lat: number, lng: number) => {
		return this.bounds1.contains([lng, lat]) || this.bounds2.contains([lng, lat]);
	};
}
