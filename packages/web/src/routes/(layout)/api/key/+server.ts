import { error, text } from '@sveltejs/kit';

import * as schema from '$lib/server/database/schema';
import { getDb } from '$lib/server/database/client';
import { getUser } from '$lib/server/auth';

import { domainsSchema, nameSchema } from '$lib/shared/validation';

import { and, eq } from 'drizzle-orm';

import type { RequestHandler } from './$types';
import { API_KEY_ADMIN_EMAIL } from '$env/static/private';

export const POST: RequestHandler = async (event) => {
	const apiKey = await event.request.json<{ key: string; name: string; domains: string[] }>();

	const name = apiKey.name;
	if (!nameSchema.safeParse(name).success) error(400, 'Invalid name!');

	const domains = apiKey.domains;
	if (!domainsSchema.safeParse(domains).success) error(400, 'Invalid domains!');

	const user = await getUser(event);
	if (!user) error(401, 'Not authenticated!');

	const db = getDb(event.platform?.env.DB);
	const dbKey = apiKey.key;

	if (dbKey) {
		await db
			.update(schema.apiKeys)
			.set({
				name: name,
				domains: domains.join(','),
				updatedAt: new Date()
			})
			.where(and(eq(schema.apiKeys.key, dbKey), user.email != API_KEY_ADMIN_EMAIL ? eq(schema.apiKeys.userId, user.id) : undefined));
	} else {
		await db.insert(schema.apiKeys).values({
			key: crypto.randomUUID().replace(/-/g, ''),
			userId: user.id,
			name: name,
			domains: domains.join(','),
			active: true,
			unlimited: false,
			createdAt: new Date(),
			updatedAt: new Date()
		});
	}

	return text('OK');
};

export const DELETE: RequestHandler = async (event) => {
	const apiKey = await event.request.json<{ key: string }>();
	if (!apiKey.key) error(400, 'Invalid API key!');

	const user = await getUser(event);
	if (!user) error(401, 'Not authenticated!');

	const db = getDb(event.platform?.env.DB);
	const dbApiKey = await db.query.apiKeys.findFirst({
		where: and(eq(schema.apiKeys.key, apiKey.key), user.email != API_KEY_ADMIN_EMAIL ? eq(schema.apiKeys.userId, user.id) : undefined)
	});
	if (!dbApiKey) error(404, 'API key not found');

	if (dbApiKey.unlimited == true) {
		await db
			.update(schema.apiKeys)
			.set({ active: false })
			.where(and(eq(schema.apiKeys.userId, user.id), eq(schema.apiKeys.index, dbApiKey.index)));
	} else {
		await db.delete(schema.apiKeyUsages).where(eq(schema.apiKeyUsages.keyIndex, dbApiKey.index));
		await db.delete(schema.apiKeys).where(eq(schema.apiKeys.key, apiKey.key));
	}

	return text('OK');
};
