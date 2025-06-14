import { API_KEY_FREE_KEY } from '$env/static/private';

import type { Popup } from '@workspace/shared/src/types.js';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	const request: Popup.StatesRequest = await event.request.json();
	if (!request) return new Response(null, { status: 400, statusText: 'Missing request' });

	const key = API_KEY_FREE_KEY;
	const parameters = request.parameters;
	const data = request.data;

	const statesResponse = await event.fetch(`/api/public/v1/popup/states`, {
		method: 'POST',
		body: JSON.stringify({ key, parameters, data })
	});

	// Return the response
	return statesResponse;
};
