<script lang="ts">
	import Icon from './Icon.svelte';

	import type { MapPopup } from '$lib/main.js';

	let { id, popup }: { id: string; popup: MapPopup } = $props();
</script>

<div {id} class="popup">
	{popup.data.rank}
</div>

<style lang="less">
	.popup {
		width: 48px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: red;
		font-size: 14px;
		font-weight: bold;
	}
</style>
