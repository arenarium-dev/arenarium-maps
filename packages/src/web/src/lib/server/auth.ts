import * as schema from '$lib/server/database/schema';
import { getDb } from '$lib/server/database/client';

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import type { RequestEvent } from '@sveltejs/kit';

let auth: ReturnType<typeof betterAuth> | undefined = undefined;

export function getBetterAuth(event: RequestEvent) {
	if (auth == undefined) {
		auth = betterAuth({
			secret: event.platform?.env.AUTH_SECRET,
			baseURL: event.url.origin,
			database: drizzleAdapter(getDb(event.platform?.env.DB), {
				provider: 'sqlite',
				schema: {
					user: schema.users,
					session: schema.sessions,
					account: schema.account,
					verification: schema.verification
				}
			}),
			socialProviders: {
				github: {
					clientId: event.platform?.env.AUTH_GITHUB_ID,
					clientSecret: event.platform?.env.AUTH_GITHUB_SECRET
				}
			}
		});
	}

	return auth;
}

export async function getUser(event: RequestEvent) {
	const auth = getBetterAuth(event);
	const session = await auth.api.getSession({ headers: event.request.headers });
	return session?.user;
}
