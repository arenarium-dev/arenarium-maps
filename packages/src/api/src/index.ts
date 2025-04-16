import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { getBlocks } from '@workspace/shared/src/marker/blocks/blocks.js';
import type { Types } from '@workspace/shared/src/types.js';

const app = new Hono();

app.use(
	'/*',
	cors({
		origin: ['http://localhost:5173']
	})
);

app.get('/', (c) => {
	return c.text('Hello Hono!');
});

app.post('/:version/blocks', async (c) => {
	const popups = await c.req.json<Types.Popup[]>();
	const blocks = getBlocks(popups);

	return c.json(blocks);
});

app.onError((err, c) => {
	console.error(`${err}`);
	return c.text('Error', 500);
});

export default app;
