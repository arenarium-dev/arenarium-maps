<script lang="ts">
	let { price, width, height }: { price: string; width: number; height: number } = $props();
</script>

<div class="pin" style="width: {width}px; height: {height}px;">
	<div class="text">{price.replace('.', '')}</div>
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
