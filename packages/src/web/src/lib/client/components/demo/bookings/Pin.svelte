<script lang="ts">
	let { id }: { id: string } = $props();

	let idNumber = Number.parseInt(id);
	let price = 20 + Math.floor(idNumber / 100);
</script>

<div class="pin">
	<div class="text">${price}</div>
</div>

<style lang="less">
	.pin {
		display: flex;
		align-items: center;
		justify-content: center;
		// background-color: var(--map-style-background);

		.text {
			color: var(--map-style-background);
			font-weight: bold;
			font-size: 12px;
			text-align: center;
			padding: 1px 6px;
		}
	}
</style>
