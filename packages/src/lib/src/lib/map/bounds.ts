class MapBounds {
	swLat: number;
	swLng: number;
	neLat: number;
	neLng: number;

	constructor(swLng: number, swLat: number, neLng: number, neLat: number) {
		this.swLat = swLat;
		this.swLng = swLng;
		this.neLat = neLat;
		this.neLng = neLng;
	}

	public contains = (lat: number, lng: number) => {
		return this.swLat <= lat && lat <= this.neLat && this.swLng <= lng && lng <= this.neLng;
	};
}

export class MapBoundsPair {
	private bounds1: MapBounds;
	private bounds2: MapBounds;

	constructor(map: maplibregl.Map, swX: number, swY: number, neX: number, neY: number) {
		const sw = map.unproject([swX, swY]);
		const ne = map.unproject([neX, neY]);

		if (sw.lng < -180) {
			// Left
			this.bounds1 = new MapBounds(-180, sw.lat, ne.lng, ne.lat);
			// Right
			this.bounds2 = new MapBounds(sw.wrap().lng, sw.lat, 180, ne.lat);
			return;
		}

		if (ne.lng > 180) {
			// Left
			this.bounds1 = new MapBounds(sw.lng, sw.lat, 180, ne.lat);
			// Right
			this.bounds2 = new MapBounds(-180, sw.lat, ne.wrap().lng, ne.lat);
			return;
		}

		// All
		this.bounds1 = new MapBounds(sw.lng, sw.lat, ne.lng, ne.lat);
		// None
		this.bounds2 = new MapBounds(0, 0, 0, 0);
	}

	public contains = (lat: number, lng: number) => {
		return this.bounds1.contains(lat, lng) || this.bounds2.contains(lat, lng);
	};
}
