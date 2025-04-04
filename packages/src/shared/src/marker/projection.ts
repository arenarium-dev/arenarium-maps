import { MAP_BASE_SIZE } from '../constants.js';

// The mapping between latitude, longitude and pixels is defined by the web
// mercator projection.
export function getPoint(lat: number, lng: number) {
	let siny = Math.sin((lat * Math.PI) / 180);

	// Truncating to 0.9999 effectively limits latitude to 89.189. This is
	// about a third of a tile past the edge of the world tile.
	siny = Math.min(Math.max(siny, -0.9999), 0.9999);

	return {
		x: MAP_BASE_SIZE * (0.5 + lng / 360),
		y: MAP_BASE_SIZE * (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI))
	};
}
