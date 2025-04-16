import { getBlocks as getBlocksCore } from '@workspace/shared/src/marker/blocks/blocks.js';
import type { Types } from '@workspace/shared/src/types.js';

import { PUBLIC_API_URL } from '$env/static/public';

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
		switch (import.meta.env.MODE) {
			case 'browser': {
				return getBlocksCore(popups);
			}
			case 'development': {
				return getBlocksApi(popups);
			}
			default: {
				return getBlocksApi(popups);
			}
		}
	} finally {
		console.log(`[BLOCKS ${popups.length}] ${performance.now() - now}ms`);
	}
}

async function getBlocksApi(popups: Types.Popup[]): Promise<Types.Block[]> {
	const response = await fetch(`${PUBLIC_API_URL}/v1/blocks`, {
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
