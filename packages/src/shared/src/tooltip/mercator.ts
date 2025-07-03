// https://en.wikipedia.org/wiki/Web_Mercator_projection

export namespace Mercator {
	/**
	 * @param lat - The latitude of the point.
	 * @param lng - The longitude of the point.
	 * @param size - The size of the map at zoom n in pixels.
	 */
	export function project(lat: number, lng: number, size: number) {
		return {
			x: xRatiofromLng(lng) * size,
			y: yRatiofromLat(lat) * size
		};
	}

	/**
	 * @param x - The x coordinate of the point in pixels.
	 * @param y - The y coordinate of the point in pixels.
	 * @param size - The size of the map at zoom n in pixels.
	 */
	export function unproject(x: number, y: number, size: number) {
		return {
			lat: latFromYRatio(y / size),
			lng: lngFromXratio(x / size)
		};
	}

	/**	 
	 * @param lng 
	 * @returns a number between 0 and 1 representing the x coordinate ratio. (left to right)
	 */  
	function xRatiofromLng(lng: number) {
		return (180 + lng) / 360;
	}

	/**
	 * @param lat 
	 * @returns a number between 0 and 1 representing the y coordinate ratio. (top to bottom)
	 */
	function yRatiofromLat(lat: number) {
		return (180 - (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))) / 360;
	}

	/** 
	 * @param x a number between 0 and 1 representing the x coordinate ratio. (left to right)
	 * @returns a number between -180 and 180 representing the longitude.
	 */
	function lngFromXratio(x: number) {
		return x * 360 - 180;
	}

	/** 
	 * @param y a number between 0 and 1 representing the y coordinate ratio. (top to bottom)
	 * @returns a number between -90 and 90 representing the latitude.
	 */
	function latFromYRatio(y: number) {
		return (360 / Math.PI) * Math.atan(Math.exp(((180 - y * 360) * Math.PI) / 180)) - 90;
	}
}
