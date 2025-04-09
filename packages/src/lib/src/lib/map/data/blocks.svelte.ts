import type { MapPopup } from '../input.js';

import { getBlocks as getBlocksApi } from '@workspace/shared/src/marker/blocks/blocks.js';
import type { Types } from '@workspace/shared/src/types.js';

export class BlockData {
	block: Types.Block;
	loaded: boolean;

	constructor(block: Types.Block) {
		this.block = block;
		this.loaded = false;
	}
}

export async function getBlocks(markers: MapPopup[]): Promise<Types.Block[]> {
	const now = performance.now();
	const blocks = await getBlocksApi(markers);
	console.log(`[BLOCKS ${markers.length}] ${performance.now() - now}ms`);
	return blocks;
}
