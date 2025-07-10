import { API_KEY_FREE_KEY } from '$env/static/private';

import type { Tooltip } from '@workspace/shared/src/types.js';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	const request: Tooltip.StatesRequest = await event.request.json();
	if (!request) return new Response(null, { status: 400, statusText: 'Missing request' });

	const key = API_KEY_FREE_KEY;
	const parameters = request.parameters;
	const input = request.input;

	const statesResponse = await event.fetch(`/api/public/v1/tooltip/states`, {
		method: 'POST',
		body: JSON.stringify({ key, parameters, input })
	});

	// Return the response
	return statesResponse;
};
