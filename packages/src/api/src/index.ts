import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { getStates } from '@workspace/shared/src/marker/compute/states.js';
import type { Types } from '@workspace/shared/src/types.js';

type Bindings = {
	API_KEY_HOST_URL: string;
	API_KEY_FREE_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('/*', cors());

app.onError((err, c) => {
	console.error(`${err}`);
	return c.text('Error', 500);
});

app.get('/', (c) => {
	return c.text('Hello Aranarium Maps!');
});

app.get('/api', (c) => {
	return c.text('Hello Aranarium Maps API!');
});

app.post('/:version/popups/states', async (c) => {
	// Get the data from the request body
	const body = await c.req.json<Types.PopupStatesRequest>();
	if (!body) return c.text('Missing request body', 400);

	// Get the API key
	const key = body.apiKey;
	if (!key) return c.text('Missing API key', 400);

	if (key != c.env.API_KEY_FREE_KEY) {
		// Check if the API key valid
		const url = `${c.env.API_KEY_HOST_URL}/api/key/${key}`;
		const response = await fetch(url);
		if (!response.ok) return c.text('Invalid API key', 401);
	}

	// Get the states
	const states = getStates(body.data, body.minZoom, body.maxZoom);
	return c.json(states);
});

export default app;
