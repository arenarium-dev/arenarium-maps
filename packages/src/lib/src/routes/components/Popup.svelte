<script lang="ts">
	import Icon from './Icon.svelte';

	import type { MapPopup } from '$lib/main.js';

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
