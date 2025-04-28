import { error, text } from '@sveltejs/kit';

import { type MapPopupData } from '@arenarium/maps';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const total = Number(event.url.searchParams.get('total'));
	const limit = Number(event.url.searchParams.get('limit'));
	const swlat = Number(event.url.searchParams.get('swlat'));
	const swlng = Number(event.url.searchParams.get('swlng'));
	const nelat = Number(event.url.searchParams.get('nelat'));
	const nelng = Number(event.url.searchParams.get('nelng'));

	if (isNaN(total) || isNaN(limit) || isNaN(swlat) || isNaN(swlng) || isNaN(nelat) || isNaN(nelng)) {
		return error(400, 'Invalid parameters');
	}

	const coordinatesResponse = await event.fetch('/data.json');
	if (!coordinatesResponse.ok) error(500, 'Failed to get coordinates');

	const coordinatesJson = await coordinatesResponse.json<any>();
	const coordinates = coordinatesJson.coordinates;

	let randomPrev = 1;

	function random() {
		const val = (randomPrev * 16807) % 2147483647;
		randomPrev = val;
		return val / 2147483647;
	}

	const data = new Array<MapPopupData>();

	let n = 0;
	for (let i = 0; i < total; i++) {
		const lat = coordinates[i % coordinates.length].lat;
		const lng = coordinates[i % coordinates.length].lng;
		if (lat < swlat || nelat < lat || lng < swlng || nelng < lng) {
			continue;
		}

		data.push({
			id: i.toString(),
			rank: i,
			lat: lat,
			lng: lng,
			height: 100,
			width: 150
		});

		n++;
	}

	return text('OK');
};
