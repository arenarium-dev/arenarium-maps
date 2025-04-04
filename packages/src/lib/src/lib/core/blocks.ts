import { getBlocks as getBlocksApi } from '@workspace/shared/src/marker/blocks/blocks.js';
import type { MapMarker } from './validation.js';

export async function getBlocks(markers: MapMarker[]) {
	const blocks = getBlocksApi(markers);
	return blocks;
}
