import { MAP_MAX_ZOOM, MAP_ZOOM_SCALE } from '@workspace/shared/src/constants.js';
import type { Types } from '@workspace/shared/src/types.js';

export function getMarkerZIndex(zet: number) {
	return Math.round((MAP_MAX_ZOOM - zet) * MAP_ZOOM_SCALE);
}

export async function* getMarkers(popups: Types.Popup[]): AsyncGenerator<Types.Marker[]> {
	if (import.meta.env.DEV) {
		switch (import.meta.env.MODE) {
			case 'browser': {
				const markersImport = await import('@workspace/shared/src/marker/compute/markers.js');
				const markers = markersImport.getMarkers(popups);
				yield markers;
			}
			default: {
				yield* getMarkersApi(popups);
			}
		}
	} else {
		yield* getMarkersApi(popups);
	}
}

async function* getMarkersApi(popups: Types.Popup[]): AsyncGenerator<Types.Marker[]> {
	const url = import.meta.env.VITE_API_URL;
	const response = await fetch(`${url}/v1/markers`, {
		method: 'POST',
		body: JSON.stringify(popups)
	});

	for await (const markers of processResponseStream<Types.Marker>(response)) {
		yield markers;
	}
}

async function* processResponseStream<T>(response: Response): AsyncGenerator<T[]> {
	if (!response.ok || !response.body) {
		throw new Error('Failed to process response stream');
	}

	// Get the ReadableStream and reader
	const reader = response.body.getReader();
	// To decode Uint8Array chunks to strings
	const decoder = new TextDecoder();

	// Buffer to hold incomplete lines
	let buffer = '';

	// Process the stream
	while (true) {
		const { done, value } = await reader.read();

		if (done) {
			// Get remaining data in the buffer if needed
			const line = buffer.trim();
			// Yield the line as JSON
			if (line) {
				yield JSON.parse(line);
			}
			// Exit the loop
			break;
		}

		// Decode the chunk and add it to the buffer
		buffer += decoder.decode(value, { stream: true });

		// Process lines separated by newline characters
		let newlineIndex;
		// Keep processing lines as long as we find newlines
		while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
			// Get the line
			const line = buffer.slice(0, newlineIndex).trim();
			// Yield the line as JSON
			if (line) {
				yield JSON.parse(line);
			}
			// Remove the processed line from the buffer
			buffer = buffer.slice(newlineIndex + 1);
		}
	}

	return buffer;
}
