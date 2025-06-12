import { MAP_BASE_SIZE } from '../constants.js';

// https://en.wikipedia.org/wiki/Web_Mercator_projection

export function project(lat: number, lng: number) {
	return {
		x: mercatorXfromLng(lng) * MAP_BASE_SIZE,
		y: mercatorYfromLat(lat) * MAP_BASE_SIZE
	};
}

export function unproject(x: number, y: number) {
	return {
		lat: latFromMercatorY(y / MAP_BASE_SIZE),
		lng: lngFromMercatorX(x / MAP_BASE_SIZE)
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
