import { json } from '@sveltejs/kit';

import { type MapPopupData } from '@arenarium/maps';

import { getStates } from '@workspace/shared/src/marker/compute/states.js';

import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async (event) => {
	const body: {
		minZoom: number;
		maxZoom: number;
		data: MapPopupData[];
	} = await event.request.json();

	const states = getStates(body.data, body.minZoom, body.maxZoom);
	return json(states);
};
