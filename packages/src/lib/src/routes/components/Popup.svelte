<script lang="ts">
	import type { MapPopup } from '$lib/index.js';

	let { id, popup }: { id: string; popup: MapPopup } = $props();
</script>

<div {id} class="popup">
	{id}
</div>

<style lang="less">
	.popup {
		width: 150px;
		height: 100px;
		color: red;
		padding: 8px;
	}
</style>
