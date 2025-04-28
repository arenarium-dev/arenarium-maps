import { error, json, text } from '@sveltejs/kit';

import { type MapPopupData } from '@arenarium/maps';

import { API_KEY_FREE_KEY, API_URL } from '$env/static/private';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	const body: {
		minZoom: number;
		maxZoom: number;
		data: MapPopupData[];
	} = await event.request.json();

	const statesRequestBody: MapPopupStatesRequest = {
		apiKey: API_KEY_FREE_KEY,
		data: body.data,
		minZoom: body.minZoom,
		maxZoom: body.maxZoom
	};
	const statesUrl = API_URL;
	const statesResponse = await fetch(`${statesUrl}/v1/popup/states`, {
		method: 'POST',
		body: JSON.stringify(statesRequestBody)
	});

	if (!statesResponse.ok || !statesResponse.body) {
		throw new Error('Failed to get markers');
	}

	const states: MapPopupState[] = await statesResponse.json();
	return json(states);
};
