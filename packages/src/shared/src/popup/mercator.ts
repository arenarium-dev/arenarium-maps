// https://en.wikipedia.org/wiki/Web_Mercator_projection

export namespace Mercator {
	/**
	 * @param lat - The latitude of the point.
	 * @param lng - The longitude of the point.
	 * @param size - The size of the map at zoom 0 in pixels.
	 */
	export function project(lat: number, lng: number, size: number) {
		return {
			x: mercatorXfromLng(lng) * size,
			y: mercatorYfromLat(lat) * size
		};
	}

	/**
	 * @param x - The x coordinate of the point.
	 * @param y - The y coordinate of the point.
	 * @param size - The size of the map at zoom 0 in pixels.
	 */
	export function unproject(x: number, y: number, size: number) {
		return {
			lat: latFromMercatorY(y / size),
			lng: lngFromMercatorX(x / size)
		};
	}

	function mercatorXfromLng(lng: number) {
		return (180 + lng) / 360;
	}

	function mercatorYfromLat(lat: number) {
		return (180 - (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))) / 360;
	}

	function lngFromMercatorX(x: number) {
		return x * 360 - 180;
	}

	function latFromMercatorY(y: number) {
		return (360 / Math.PI) * Math.atan(Math.exp(((180 - y * 360) * Math.PI) / 180)) - 90;
	}
}
