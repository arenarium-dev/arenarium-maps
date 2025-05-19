import * as schema from '$lib/server/database/schema';
import { getDb } from '$lib/server/database/client';
import { DISCORD_WEBHOOK_URL, USAGE_MAX_ITEMS, USAGE_MAX_TIMESPAN } from '$lib/shared/constants';

import { API_KEY_FREE_KEY } from '$env/static/private';

import { getStates } from '@workspace/shared/src/marker/compute/states.js';
import type { Popup } from '@workspace/shared/src/types.js';

import { and, eq, gt, sum } from 'drizzle-orm';

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
	// Create the headers
	const headers = {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type'
	};

	const response = (status: number, message: string) => new Response(null, { headers, status, statusText: message });
	const result = (data: any) => new Response(JSON.stringify(data), { headers, status: 200 });

	try {
		const request: Popup.StatesRequest = await event.request.json();
		if (!request) return response(400, 'Missing request');

		const data = request.data;
		if (!data) return response(400, 'Missing data');

		const key = request.key;
		if (!key) return response(400, 'Missing API key');

		// Check if the API key is free
		if (key != API_KEY_FREE_KEY) {
			const db = getDb(event.platform?.env.DB);
			const dbApiKey = await db.query.apiKeys.findFirst({
				where: (k, { and, eq }) => and(eq(k.key, key), eq(k.active, true))
			});
			if (!dbApiKey) return response(404, 'API key not found');

			// Chech the api key rate limit
			if (dbApiKey.unlimited != true) {
				// Check is the request itself is larger than the limit
				if (data.length > USAGE_MAX_ITEMS) {
					return new Response(null, { headers, status: 429, statusText: 'Request too large!' });
				}

				// Get the total usage from the last second
				const dbUsageSumResult = await db
					.select({ sum: sum(schema.apiKeyUsages.count) })
					.from(schema.apiKeyUsages)
					.where(and(eq(schema.apiKeyUsages.keyIndex, dbApiKey.index), gt(schema.apiKeyUsages.date, new Date(Date.now() - USAGE_MAX_TIMESPAN))));

				const dbUsageSum = Number.parseInt(dbUsageSumResult.at(0)?.sum ?? '0');

				// Check if the total sum of request is larger than the limit
				if (dbUsageSum + data.length > USAGE_MAX_ITEMS) {
					return new Response(null, { headers, status: 429, statusText: 'Too many large requests!' });
				}

				// Update usage
				const dbUsage: schema.DbApiKeyUsageInsert = {
					keyIndex: dbApiKey.index,
					count: data.length
				};
				await db.insert(schema.apiKeyUsages).values([dbUsage]);
			}
		}

		// Get the states
		const states = getStates(data);

		// Return the response
		return result(states);
	} catch (error: any) {
		console.error(error);

		// Log to discord
		await event.fetch(DISCORD_WEBHOOK_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				username: `[Error] ${error.message}`,
				content: '```' + `${JSON.stringify(error, null, 2)}` + '```'
			})
		});

		return response(500, 'Internal server error');
	}
};
