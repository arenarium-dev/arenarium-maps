import { error, json } from '@sveltejs/kit';

import { API_KEY_FREE_KEY } from '$env/static/private';

import type { Popup } from '@workspace/shared/src/types.js';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	const requestBody: { data: Popup.Data[]; minZoom: number; maxZoom: number } = await event.request.json();
	if (!requestBody) return error(400, 'Invalid request body');

	const statesBody: Popup.StatesRequest = {
		apiKey: API_KEY_FREE_KEY,
		data: requestBody.data,
		minZoom: requestBody.minZoom,
		maxZoom: requestBody.maxZoom
	};

	const statesResponse = await event.fetch('/api/public/v1/popup/states', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(statesBody)
	});

	if (!statesResponse.ok) return error(500, 'Failed to get states');

	const states: Popup.State[] = await statesResponse.json();
	return json(states);
};
