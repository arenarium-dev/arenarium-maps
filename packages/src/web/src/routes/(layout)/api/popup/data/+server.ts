import { error, json } from '@sveltejs/kit';

import { type MapPopupData } from '@arenarium/maps';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const total = Number(event.url.searchParams.get('total'));
	const width = Number(event.url.searchParams.get('width'));
	const height = Number(event.url.searchParams.get('height'));
	const swlat = Number(event.url.searchParams.get('swlat'));
	const swlng = Number(event.url.searchParams.get('swlng'));
	const nelat = Number(event.url.searchParams.get('nelat'));
	const nelng = Number(event.url.searchParams.get('nelng'));

	if (isNaN(total) || isNaN(swlat) || isNaN(swlng) || isNaN(nelat) || isNaN(nelng)) {
		return error(400, 'Invalid parameters');
	}

	const coordinatesResponse = await event.fetch('/data.json');
	if (!coordinatesResponse.ok) error(500, 'Failed to get coordinates');

	const coordinatesJson = await coordinatesResponse.json<any>();
	const coordinates = coordinatesJson.coordinates;

	const data = new Array<MapPopupData>();

	let randomPrev = 1;
	const random = () => {
		const val = (randomPrev * 16807) % 2147483647;
		randomPrev = val;
		return val / 2147483647;
	};

	let count = 0;
	for (let i = 0; i < coordinates.length; i++) {
		const rank = Math.floor(random() * total);
		const lat = coordinates[i % coordinates.length].lat;
		const lng = coordinates[i % coordinates.length].lng;
		if (lat < swlat || nelat < lat || lng < swlng || nelng < lng) continue;

		count++;
		if (count > total) break;

		data.push({
			id: i.toString(),
			rank: rank,
			lat: lat,
			lng: lng,
			height: height,
			width: width
		});
	}

	return json(data);
};
