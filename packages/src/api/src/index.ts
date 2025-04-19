import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { getMarkers } from '@workspace/shared/src/marker/compute/markers.js';
import type { Types } from '@workspace/shared/src/types.js';

const app = new Hono();

app.use('/*', cors());

app.get('/', (c) => {
	return c.text('Hello Hono!');
});

app.post('/:version/markers', async (c) => {
	// Get the data from the request body
	const popups = await c.req.json<Types.Popup[]>();
	if (!popups || popups.length == 0) return c.json([]);

	// Get the markers
	const markers = getMarkers(popups);
	return c.json(markers);
});

app.onError((err, c) => {
	console.error(`${err}`);
	return c.text('Error', 500);
});

export default app;
