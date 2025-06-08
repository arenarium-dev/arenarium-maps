import { json } from '@sveltejs/kit';

import type { MapPopupData, MapPopupState, MapPopupStatesRequest } from '@arenarium/maps';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	const data: MapPopupData[] = await event.request.json();

	const statesRequest: MapPopupStatesRequest = {
		key: '5b2a06ecfa734dccaa0e7488aaceb487',
		data: data
	};
	const statesResponse = await fetch('https://arenarium.dev/api/public/v1/popup/states', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(statesRequest)
	});
	const states: MapPopupState[] = await statesResponse.json();

	return json(states);
};
