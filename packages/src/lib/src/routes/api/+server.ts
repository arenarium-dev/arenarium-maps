import { json } from '@sveltejs/kit';

import type { MapPopupData, MapProviderParameters } from '$lib/map/schemas.js';

import { getStates } from '@workspace/shared/src/popup/compute/states.js';

import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async (event) => {
	const data: {
		parameters: MapProviderParameters;
		data: MapPopupData[];
	} = await event.request.json();

	const states = getStates(data.parameters, data.data);
	return json(states);
};
