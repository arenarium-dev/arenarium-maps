import type { Log } from '@workspace/shared/src/types.js';

import type { RequestHandler } from './$types';

export const OPTIONS: RequestHandler = () => {
	return new Response(null, {
		headers: {
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Headers': '*'
		}
	});
};

export const POST: RequestHandler = async (event) => {
	const log: Log = await event.request.json();

	console.error(log);

	return new Response('OK', {
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type'
		}
	});
};
