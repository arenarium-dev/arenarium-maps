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
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(popups)
	});

	if (!response.ok) {
		throw new Error('Failed to fetch blocks');
	}

	const blocks: Types.Block[] = await response.json();
	return blocks;
}
