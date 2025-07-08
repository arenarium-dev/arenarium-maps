import { redirect } from '@sveltejs/kit';

import { getDb } from '$lib/server/database/client';
import { getUser } from '$lib/server/auth';

import { API_KEY_ADMIN_EMAIL } from '$env/static/private';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	event.depends('data:profile');

	const user = await getUser(event);
	if (!user) redirect(307, `/`);

	const db = getDb(event.platform?.env.DB);
	const dbUserApiKeys = await db.query.apiKeys.findMany({
		with: { apiKeyUsages: true, apiKeyUser: true },
		where: user.email != API_KEY_ADMIN_EMAIL ? (k, { eq, and }) => and(eq(k.userId, user.id), eq(k.active, true)) : undefined
	});

	const apiKeys = dbUserApiKeys.map((dbUserKey) => ({
		key: dbUserKey.key,
		name: dbUserKey.name,
		user: dbUserKey.apiKeyUser.email,
		domains: dbUserKey.domains ? dbUserKey.domains.split(',') : [],
		date: dbUserKey.createdAt,
		usage: dbUserKey.apiKeyUsages.reduce((acc, usage) => acc + usage.count, 0) ?? 0,
		active: dbUserKey.active
	}));

	return {
		admin: user.email == API_KEY_ADMIN_EMAIL,
		apiKeys: apiKeys
	};
};
