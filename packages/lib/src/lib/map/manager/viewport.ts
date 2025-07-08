import type { MapBounds } from '../schemas.js';

import { Mercator } from '@workspace/shared/src/tooltip/mercator.js';

export class MapViewport {
	swLat: number;
	swLng: number;
	neLat: number;
	neLng: number;

	/**
	 * @param mapBounds - The bounds of the map.
	 * @param mapZoom - The zoom level of the map.
	 * @param mapSize - The size of the map in pixels at zoom level 0.
	 * @param offsetX - The x offset of the map in pixels at zoom level n.
	 * @param offsetY - The y offset of the map in pixels at zoom level n.
	 */
	constructor(mapBounds: MapBounds, mapZoom: number, mapSize: number, offsetX: number, offsetY: number) {
		// Calculate the size of the map at zoom level n.
		const zoomMapSize = mapSize * Math.pow(2, mapZoom);

		// Calculate the bottom left and top right points of the map bounds in pixels at zoom level n.
		const blPoint = Mercator.project(mapBounds.sw.lat, mapBounds.sw.lng, zoomMapSize);
		const trPoint = Mercator.project(mapBounds.ne.lat, mapBounds.ne.lng, zoomMapSize);

		// Expand the bounds by the offset x and y.
		const swX = blPoint.x - offsetX;
		const swY = blPoint.y + offsetY;
		const neX = trPoint.x + offsetX;
		const neY = trPoint.y - offsetY;

		// Convert back to lat and lng.
		const sw = Mercator.unproject(swX, swY, zoomMapSize);
		const ne = Mercator.unproject(neX, neY, zoomMapSize);

		// Set the bounds.
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
