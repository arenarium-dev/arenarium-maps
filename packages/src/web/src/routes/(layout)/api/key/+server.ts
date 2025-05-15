import { error, text } from '@sveltejs/kit';

import * as schema from '$lib/server/database/schema';
import { getDb } from '$lib/server/database/client';
import { getUser } from '$lib/server/auth';

import { nameSchema } from '$lib/shared/validation';

import { and, eq } from 'drizzle-orm';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	const apiKey = await event.request.json<{ id: string; name: string }>();

	const name = apiKey.name;
	if (!nameSchema.safeParse(name).success) error(400, 'Invalid name');

	const user = await getUser(event);
	if (!user) error(401, 'Not authenticated');

	const db = getDb(event.platform?.env.DB);
	const dbId = apiKey.id;

	if (dbId) {
		await db
			.update(schema.apiKeys)
			.set({
				name: name,
				updatedAt: new Date()
			})
			.where(eq(schema.apiKeys.id, dbId));
	} else {
		await db.insert(schema.apiKeys).values({
			id: crypto.randomUUID(),
			userId: user.id,
			name: name,
			key: crypto.randomUUID().replace(/-/g, ''),
			active: true,
			unlimited: false,
			createdAt: new Date(),
			updatedAt: new Date()
		});
	}

	return text('OK');
};

export const DELETE: RequestHandler = async (event) => {
	const apiKey = await event.request.json<{ id: string }>();

	const apiKeyId = apiKey.id;
	if (!apiKeyId) error(400, 'Invalid API key ID');

	const user = await getUser(event);
	if (!user) error(401, 'Not authenticated');

	const db = getDb(event.platform?.env.DB);
	await db
		.update(schema.apiKeys)
		.set({ active: false })
		.where(and(eq(schema.apiKeys.userId, user.id), eq(schema.apiKeys.id, apiKeyId)));

	return text('OK');
};
