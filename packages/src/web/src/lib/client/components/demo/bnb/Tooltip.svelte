<script lang="ts">
	let { id, width, height }: { id: string; width: number; height: number } = $props();

	let fontSize = Math.min(width, height) / 2;

	let idNumber = Number.parseInt(id);
	let price = 20 + Math.round(idNumber / 10);
</script>

<div class="pin" style="width: {width}px; height: {height}px; font-size: {fontSize}px;">
	<div class="text">${price}</div>
</div>

<style lang="less">
	.pin {
		display: flex;
		align-items: center;
		justify-content: center;
		padding-bottom: 1px;

		.text {
			color: var(--map-style-text);
			font-weight: bold;
			text-align: center;
		}
	}
</style>
