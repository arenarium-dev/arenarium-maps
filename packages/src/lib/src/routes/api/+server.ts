import { json } from '@sveltejs/kit';

import { type MapPopupData } from '@arenarium/maps';

import { getStates } from '@workspace/shared/src/popup/compute/states.js';

import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async (event) => {
	const data: MapPopupData[] = await event.request.json();
	const states = getStates(data);
	return json(states);
};
