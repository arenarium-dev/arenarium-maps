import { DISCORD_WEBHOOK_URL } from '$lib/shared/constants';

import type { Log } from '@workspace/shared/src/types.js';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	console.log('EEE');

	const logString = event.url.searchParams.get('log');
	if (!logString) return new Response(null, { status: 400 });

	const logJson = decodeURIComponent(logString);
	const log: Log = JSON.parse(logJson);

	// Log to discord
	await event.fetch(DISCORD_WEBHOOK_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			username: `${log.title}`,
			content: '```' + `${JSON.stringify(log.content, null, 2)}` + '```'
		})
	});

	return new Response('OK');
};
