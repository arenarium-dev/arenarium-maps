import { error } from '@sveltejs/kit';

import * as schema from '$lib/server/database/schema';
import { getDb } from '$lib/server/database/client';

import { and, eq } from 'drizzle-orm';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const apiKey = event.params.key;

	const db = getDb(event.platform?.env.DB);
	const dbApiKey = await db.query.apiKeys.findFirst({
		where: and(eq(schema.apiKeys.key, apiKey), eq(schema.apiKeys.active, true))
	});
	if (!dbApiKey) error(404, 'API key not found');

	return new Response(null);
};
