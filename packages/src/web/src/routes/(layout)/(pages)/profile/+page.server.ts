import { redirect } from '@sveltejs/kit';

import * as schema from '$lib/server/database/schema';
import { getDb } from '$lib/server/database/client';
import { getUser } from '$lib/server/auth';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const user = await getUser(event);
	if (!user) redirect(307, `/`);

	const db = getDb(event.platform?.env.DB);
	const dbUserApiKeys = await db.query.apiKeys.findMany({
		where: (k, { eq }) => eq(k.userId, user.id)
	});

	const apiKeys = dbUserApiKeys.map((dbUserKey) => ({
		id: dbUserKey.id,
		key: dbUserKey.key,
		name: dbUserKey.name,
		domains: dbUserKey.domains as string[],
		active: dbUserKey.active
	}));

	return {
		apiKeys: apiKeys
	};
};
