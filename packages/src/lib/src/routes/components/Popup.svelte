<script lang="ts">
	import Icon from './Icon.svelte';

	import type { MapPopup } from '$lib/main.js';

	let { id, popup }: { id: string; popup: MapPopup } = $props();
</script>

<div {id} class="popup" style:width={popup.data.width + 'px'} style:height={popup.data.height + 'px'}>
	{popup.data.rank}
</div>

<style lang="less">
	.popup {
		display: flex;
		align-items: center;
		justify-content: center;
		color: red;
		font-size: 14px;
		font-weight: bold;
	}
</style>
