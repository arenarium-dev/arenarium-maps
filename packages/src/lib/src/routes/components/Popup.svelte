<script lang="ts">
	import type { MapPopup } from '$lib/index.js';
	import Icon from './Icon.svelte';

	let { id, popup }: { id: string; popup: MapPopup } = $props();
</script>

<div {id} class="popup">
	{id}-{popup.data.rank}
	<Icon name={'location_on'} />
</div>

<style lang="less">
	.popup {
		width: 150px;
		height: 100px;
		color: red;
		padding: 8px;
		font-size: 16px;
		font-weight: bold;
	}
</style>
