import { error, json } from '@sveltejs/kit';

import { getDb } from '$lib/server/database/client';

import { API_KEY_FREE_KEY } from '$env/static/private';

import { getStates } from '@workspace/shared/src/marker/compute/states.js';
import type { Popup } from '@workspace/shared/src/types.js';

import type { RequestHandler } from './$types';

export const OPTIONS: RequestHandler = () => {
	return new Response(null, {
		headers: {
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Headers': '*'
		}
	});
};

export const POST: RequestHandler = async (event) => {
	const statesRequest: Popup.StatesRequest = await event.request.json();
	if (!statesRequest) return error(400, 'Invalid request body');

	// Get the API key
	const key = statesRequest.apiKey;
	if (!key) return error(400, 'Missing API key');

	if (key != API_KEY_FREE_KEY) {
		const db = getDb(event.platform?.env.DB);
		const dbApiKey = await db.query.apiKeys.findFirst({
			where: (k, { and, eq }) => and(eq(k.key, key), eq(k.active, true))
		});
		if (!dbApiKey) error(404, 'API key not found');
	}

	const states = getStates(statesRequest.data, statesRequest.minZoom, statesRequest.maxZoom);
	return json(states);
};
