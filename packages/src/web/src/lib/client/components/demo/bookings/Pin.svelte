<script lang="ts">
	let { id, width, height }: { id: string; width: number; height: number } = $props();

	let fontSize = Math.min(width, height) / 2;

	let idNumber = Number.parseInt(id);
	let price = 20 + Math.floor(idNumber / 100);
</script>

<div class="pin" style="width: {width - 4}px; height: {height - 4}px; font-size: {fontSize}px;">
	<div class="text">${price}</div>
</div>

<style lang="less">
	.pin {
		display: flex;
		align-items: center;
		justify-content: center;
		padding-bottom: 1px;

		.text {
			color: var(--map-style-background);
			font-weight: bold;
			text-align: center;
		}
	}
</style>
