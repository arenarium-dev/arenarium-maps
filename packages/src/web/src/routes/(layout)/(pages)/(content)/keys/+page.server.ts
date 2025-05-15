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
		where: (k, { eq, and }) => and(eq(k.userId, user.id), eq(k.active, true))
	});

	const apiKeys = dbUserApiKeys.map((dbUserKey) => ({
		id: dbUserKey.id,
		key: dbUserKey.key,
		name: dbUserKey.name,
		date: dbUserKey.createdAt,
		active: dbUserKey.active
	}));

	return {
		apiKeys: apiKeys
	};
};
