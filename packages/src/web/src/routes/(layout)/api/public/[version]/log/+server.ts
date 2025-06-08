import type { Log } from '@workspace/shared/src/types.js';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const logString = event.url.searchParams.get('log');
	if (!logString) return new Response(null, { status: 400 });

	const logJson = decodeURIComponent(logString);
	const log: Log = JSON.parse(logJson);

	console.error(log);

	return new Response('OK', {
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET'
		}
	});
};
