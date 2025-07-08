<script lang="ts">
	import type { MapMarker } from '$lib/main.js';

	let { id, marker }: { id: string; marker: MapMarker } = $props();

	const popup = marker.popup;
	if (!popup) throw new Error('Failed to get popup');
</script>

<div {id} class="marker" style:width={popup.style.width + 'px'} style:height={popup.style.height + 'px'}>
	{marker.rank}
</div>

<style lang="less">
	.marker {
		display: flex;
		align-items: center;
		justify-content: center;
		color: purple;
		font-size: 14px;
		font-weight: bold;
	}
</style>
