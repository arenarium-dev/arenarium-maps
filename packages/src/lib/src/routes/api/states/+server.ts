import { json } from '@sveltejs/kit';

import type { MapPopupData, MapProviderParameters } from '$lib/map/schemas.js';

import { getStates } from '@workspace/shared/src/popup/compute/states.js';
import { testStates } from '@workspace/shared/src/popup/compute/test.js';

import type { RequestHandler } from '../$types.js';

export const POST: RequestHandler = async (event) => {
	const data: {
		parameters: MapProviderParameters;
		data: MapPopupData[];
	} = await event.request.json();

	let now = performance.now();
	const states = getStates(data.parameters, data.data);
	console.log(`[STATES CALCULATION ${data.data.length}] ${performance.now() - now}ms`);

	now = performance.now();
	testStates(data.parameters, data.data, states);
	console.log(`[STATES TEST ${data.data.length}] ${performance.now() - now}ms`);

	return json(states);
};
