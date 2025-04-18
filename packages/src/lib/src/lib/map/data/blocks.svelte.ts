import type { Types } from '@workspace/shared/src/types.js';

export class BlockData {
	block: Types.Block;
	loaded: boolean;

	constructor(block: Types.Block) {
		this.block = block;
		this.loaded = false;
	}
}

export async function getBlocks(popups: Types.Popup[]): Promise<Types.Block[]> {
	const now = performance.now();

	try {
		if (import.meta.env.DEV) {
			switch (import.meta.env.MODE) {
				case 'browser': {
					const blocks = await import('@workspace/shared/src/marker/blocks/blocks.js');
					return blocks.getBlocks(popups);
				}
				default: {
					return getBlocksApi(popups);
				}
			}
		} else {
			return getBlocksApi(popups);
		}
	} finally {
		console.log(`[BLOCKS ${popups.length}] ${performance.now() - now}ms`);
	}
}

async function getBlocksApi(popups: Types.Popup[]): Promise<Types.Block[]> {
	const url = import.meta.env.VITE_API_URL;
	const response = await fetch(`${url}/v1/blocks`, {
		method: 'POST',
		body: JSON.stringify(popups)
	});

	let blocks: Types.Block[] = [];

	await processResponseStream(response, (line: string) => {
		if (!line) return;
		const block = JSON.parse(line);
		blocks.push(block);
	});

	return blocks;
}

async function processResponseStream(response: Response, processJson: (line: string) => void) {
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
			// Process any remaining data in the buffer if needed
			processJson(buffer.trim());
			break; // Exit the loop
		}

		// Decode the chunk and add it to the buffer
		buffer += decoder.decode(value, { stream: true });

		// Process lines separated by newline characters
		let newlineIndex;
		// Keep processing lines as long as we find newlines
		while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
			// Get the line
			const line = buffer.slice(0, newlineIndex).trim();
			// Remove the processed line from the buffer
			buffer = buffer.slice(newlineIndex + 1);
			// Process the line
			processJson(line);
		}
	}

	return buffer;
}
