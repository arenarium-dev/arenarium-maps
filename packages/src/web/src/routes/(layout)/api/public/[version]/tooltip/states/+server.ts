import * as schema from '$lib/server/database/schema';
import { getDb } from '$lib/server/database/client';
import { USAGE_MAX_ITEMS, USAGE_MAX_TIMESPAN } from '$lib/shared/constants';

import { API_KEY_FREE_KEY } from '$env/static/private';

import { getStates } from '@workspace/shared/src/tooltip/compute/states';
import type { Tooltip } from '@workspace/shared/src/types.js';

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

	const request: Tooltip.StatesRequest = await event.request.json();
	if (!request) return response(400, 'Missing request');

	const parameters = request.parameters;
	const input = request.input;
	if (!parameters || !input) return response(400, 'Missing parameters or data');

	const key = request.key;
	if (!key) return response(400, 'Missing API key');

	// Check if the API key is free
	if (key != API_KEY_FREE_KEY) {
		const db = getDb(event.platform?.env.DB);
		const dbApiKey = await db.query.apiKeys.findFirst({
			where: (k, { and, eq }) => and(eq(k.key, key), eq(k.active, true))
		});
		if (!dbApiKey) return response(404, 'API key not found');

		// Check if the request domain is allowed
		if (dbApiKey.domains) {
			const source = event.request.headers.get('origin') ?? event.request.headers.get('referer');
			if (!source) return response(403, 'Request not allowed for this domain!');

			const domains = dbApiKey.domains.split(',');
			if (!domains.includes(new URL(source).host)) return response(403, 'Request not allowed for this domain!');
		}

		// Chech the api key rate limit
		if (dbApiKey.unlimited != true) {
			// Check is the request itself is larger than the limit
			if (input.length > USAGE_MAX_ITEMS) {
				return new Response(null, { headers, status: 429, statusText: 'Request too large!' });
			}

			// Get the total usage from the last second
			const dbUsageSumResult = await db
				.select({ sum: sum(schema.apiKeyUsages.count) })
				.from(schema.apiKeyUsages)
				.where(and(eq(schema.apiKeyUsages.keyIndex, dbApiKey.index), gt(schema.apiKeyUsages.date, new Date(Date.now() - USAGE_MAX_TIMESPAN))));

			const dbUsageSum = Number.parseInt(dbUsageSumResult.at(0)?.sum ?? '0');

			// Check if the total sum of request is larger than the limit
			if (dbUsageSum + input.length > USAGE_MAX_ITEMS) {
				return new Response(null, { headers, status: 429, statusText: 'Too many large requests!' });
			}
		}

		// Update usage after the request
		event.platform?.context?.waitUntil(
			new Promise(async () => {
				const dbUsage: schema.DbApiKeyUsageInsert = {
					keyIndex: dbApiKey.index,
					count: input.length
				};
				await db.insert(schema.apiKeyUsages).values([dbUsage]);
			})
		);
	}

	// Get the states
	const states = getStates(parameters, input);

	// Return the response
	return result(states);
};
