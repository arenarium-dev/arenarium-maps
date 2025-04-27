import * as schema from '$lib/server/database/schema';
import { getDb } from '$lib/server/database/client';

import type { PageServerLoad } from './$types';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	const db = getDb(event.platform?.env.DB);

	// await db.delete(schema.apiKeys).where(eq(schema.apiKeys.id, 'website'));

	const dbApiKey = await db.query.apiKeys.findFirst({
		where: (k, { eq }) => eq(k.id, 'website')
	});

	if (!dbApiKey) {
		const key = crypto.randomUUID().replaceAll('-', '');
		const domain = event.request.headers.get('host');
		if (!domain) throw new Error('Missing domain');

		await db.insert(schema.apiKeys).values({
			id: 'website',
			userId: 'website',
			key: key,
			name: 'Website',
			domains: [domain],
			active: true
		});
		return {
			apiKey: key
		};
	}

	return {
		apiKey: dbApiKey.key
	};
};
