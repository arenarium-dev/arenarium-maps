<script lang="ts">
	import Icon from './Icon.svelte';

	import type { MapMarker } from '$lib/main.js';

	let { id, marker }: { id: string; marker: MapMarker } = $props();
</script>

<div {id} class="marker" style:width={marker.tooltip.style.width + 'px'} style:height={marker.tooltip.style.height + 'px'}>
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
