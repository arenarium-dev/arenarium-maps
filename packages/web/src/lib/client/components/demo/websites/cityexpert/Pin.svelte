<script lang="ts">
	let { type }: { id: string; type: string } = $props();
</script>

<div class="pin">
	<img class="type" loading="lazy" src="https://cityexpert.rs/icons/map/pin_{type}.png" alt={type} />
</div>

<style lang="less">
	.pin {
		width: 20px;
		height: 20px;

		.type {
			width: 20px;
			height: 20px;
			border-radius: 50%;
			overflow: hidden;
			object-fit: cover;
			object-position: 50% 1px;
		}
	}
</style>
