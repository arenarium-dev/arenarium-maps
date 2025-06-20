import { json } from '@sveltejs/kit';

import type { MapTooltipStateInput, MapProviderParameters } from '$lib/map/schemas.js';

import { getStates } from '@workspace/shared/src/tooltip/compute/states.js';
import { testStates } from '@workspace/shared/src/tooltip/compute/test.js';

import type { RequestHandler } from '../$types.js';

export const POST: RequestHandler = async (event) => {
	const data: {
		parameters: MapProviderParameters;
		input: MapTooltipStateInput[];
	} = await event.request.json();

	let now = performance.now();
	const states = getStates(data.parameters, data.input);
	console.log(`[STATES CALCULATION ${data.input.length}] ${performance.now() - now}ms`);

	now = performance.now();
	testStates(data.parameters, data.input, states);
	console.log(`[STATES TEST ${data.input.length}] ${performance.now() - now}ms`);

	return json(states);
};
