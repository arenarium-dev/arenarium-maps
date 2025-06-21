import type { MapProviderParameters } from '../schemas.js';

import { Mercator } from '@workspace/shared/src/tooltip/mercator.js';

export class MapBounds {
	swLat: number;
	swLng: number;
	neLat: number;
	neLng: number;

	constructor(swX: number, swY: number, neX: number, neY: number, parameters: MapProviderParameters) {
		const sw = Mercator.unproject(swX, swY, parameters.mapSize);
		const ne = Mercator.unproject(neX, neY, parameters.mapSize);
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
