<script lang="ts">
	let { price }: { id: string; price: string } = $props();
</script>

<div class="pin">
	<div class="text">€{price}</div>
</div>

<style lang="less">
	.pin {
		display: flex;
		align-items: center;
		justify-content: center;

		.text {
			color: var(--map-style-text);
			font-weight: bold;
			font-size: 12px;
			text-align: center;
			padding: 1px 6px;
		}
	}
</style>
