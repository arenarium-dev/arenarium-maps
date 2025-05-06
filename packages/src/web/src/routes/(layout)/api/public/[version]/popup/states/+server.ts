import { error, json } from '@sveltejs/kit';

import * as schema from '$lib/server/database/schema';
import { getDb } from '$lib/server/database/client';

import { API_KEY_FREE_KEY } from '$env/static/private';

import { getStates } from '@workspace/shared/src/marker/compute/states.js';
import { MAP_MAX_ZOOM, MAP_MIN_ZOOM } from '@workspace/shared/src/constants';
import type { Popup } from '@workspace/shared/src/types.js';

import { z } from 'zod';

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
	if (!statesRequest) error(400, 'Invalid request body');

	const data = statesRequest.data;
	if (!data) error(400, 'Missing data');

	const number = z.number();

	const minZoom = statesRequest.minZoom ?? MAP_MIN_ZOOM;
	if (number.safeParse(minZoom).success == false) error(400, 'Invalid min zoom');

	const maxZoom = statesRequest.maxZoom ?? MAP_MAX_ZOOM;
	if (number.safeParse(maxZoom).success == false) error(400, 'Invalid max zoom');

	// Get the API key
	const key = statesRequest.apiKey;
	if (!key) error(400, 'Missing API key');

	if (key != API_KEY_FREE_KEY) {
		const db = getDb(event.platform?.env.DB);
		const dbApiKey = await db.query.apiKeys.findFirst({
			where: (k, { and, eq }) => and(eq(k.key, key), eq(k.active, true))
		});
		if (!dbApiKey) error(404, 'API key not found');

		// Update usage
		const dbUsage: schema.DbApiKeyUsageInsert = {
			id: crypto.randomUUID(),
			keyId: dbApiKey.id,
			count: data.length
		};
		await db.insert(schema.apiKeyUsages).values([dbUsage]);
	}

	const states = getStates(data, minZoom, maxZoom);
	return json(states);
};
