import maplibregl from 'maplibre-gl';

export class MapBoundsPair {
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
