import type { MapBounds } from '../schemas.js';

import { Mercator } from '@workspace/shared/src/tooltip/mercator.js';

export class MapViewport {
	swLat: number;
	swLng: number;
	neLat: number;
	neLng: number;

	constructor(mapBounds: MapBounds, mapZoom: number, mapSize: number, offsetX: number, offsetY: number) {
		const zoomSize = mapSize * Math.pow(2, mapZoom);

		const blPoint = Mercator.project(mapBounds.sw.lat, mapBounds.sw.lng, zoomSize);
		const trPoint = Mercator.project(mapBounds.ne.lat, mapBounds.ne.lng, zoomSize);

		const swX = blPoint.x - offsetX;
		const swY = blPoint.y + offsetY;
		const neX = trPoint.x + offsetX;
		const neY = trPoint.y - offsetY;

		const sw = Mercator.unproject(swX, swY, zoomSize);
		const ne = Mercator.unproject(neX, neY, zoomSize);

		this.swLat = sw.lat;
		this.swLng = sw.lng;
		this.neLat = ne.lat;
		this.neLng = ne.lng;
	}

	public contains = (lat: number, lng: number) => {
		if (this.swLat <= lat && lat <= this.neLat) {
			if (this.swLng < this.neLng) {
				return this.swLng <= lng && lng <= this.neLng;
			} else {
				return lng <= this.neLng || this.swLng <= lng;
			}
		} else {
			return false;
		}
	};
}
