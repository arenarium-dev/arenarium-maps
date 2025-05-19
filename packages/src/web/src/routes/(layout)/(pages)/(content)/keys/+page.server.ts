import { redirect } from '@sveltejs/kit';

import { getDb } from '$lib/server/database/client';
import { getUser } from '$lib/server/auth';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	event.depends('data:profile');

	const user = await getUser(event);
	if (!user) redirect(307, `/`);

	const db = getDb(event.platform?.env.DB);
	const dbUserApiKeys = await db.query.apiKeys.findMany({
		with: { apiKeyUsages: true },
		where: (k, { eq, and }) => and(eq(k.userId, user.id), eq(k.active, true))
	});

	const apiKeys = dbUserApiKeys.map((dbUserKey) => ({
		key: dbUserKey.key,
		name: dbUserKey.name,
		date: dbUserKey.createdAt,
		usage: dbUserKey.apiKeyUsages.reduce((acc, usage) => acc + usage.count, 0) ?? 0,
		active: dbUserKey.active
	}));

	return {
		apiKeys: apiKeys
	};
};
