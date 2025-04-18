import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { getMarkers } from '@workspace/shared/src/marker/compute/markers.js';
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

app.post('/:version/markers', async (c) => {
	// Get the data from the request body
	const popups = await c.req.json<Types.Popup[]>();
	if (!popups || popups.length == 0) return c.json([]);

	// Create a TransformStream for encoding
	// We use TextEncoderStream to convert strings to Uint8Array automatically.
	const stream = new TransformStream();
	const writer = stream.writable.getWriter();
	const encoder = new TextEncoder(); // Used to encode strings to Uint8Array

	// Function to simulate asynchronous data processing and writing chunks
	const writeStream = async () => {
		try {
			// Convert the data to blocks
			const markers = getMarkers(popups);
			const markersChunkSize = 128;

			for (let i = 0; i < markers.length; i += markersChunkSize) {
				// Get the current chunk
				const markersChunk = markers.slice(i, i + markersChunkSize);
				// Convert each object to a JSON string followed by a newline
				const jsonLine = JSON.stringify(markersChunk) + '\n';
				// Encode the string to Uint8Array and write to the stream
				await writer.write(encoder.encode(jsonLine));
			}

			// Close the writer when all data is sent
			await writer.close();
		} catch (e) {
			// Abort the writer if an error occurs
			console.error('Error writing stream:', e);
			await writer.abort(e);
		}
	};

	// Start writing data without waiting for it to finish
	// This allows the response to be sent immediately while data is generated/streamed.
	writeStream();

	// Return the Response with the readable stream
	return new Response(stream.readable, {
		headers: {
			// Set content type to indicate newline-delimited JSON
			'Content-Type': 'application/x-ndjson',
			// Indicate streaming - though often implicitly handled by ReadableStream body
			'Transfer-Encoding': 'chunked',
			// Optional: Disable caching if data is dynamic
			'Cache-Control': 'no-cache'
		}
	});
});

app.onError((err, c) => {
	console.error(`${err}`);
	return c.text('Error', 500);
});

export default app;
