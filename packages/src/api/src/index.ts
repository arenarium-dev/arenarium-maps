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
	const body = await c.req.json<Types.MarkersRequest>();
	if (!body) return c.text('Invalid request body', 400);

	// Get the markers
	const markers = getMarkers(body.popups, body.minZoom, body.maxZoom);
	return c.json(markers);
});

app.onError((err, c) => {
	console.error(`${err}`);
	return c.text('Error', 500);
});

export default app;
