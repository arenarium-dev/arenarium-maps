<script lang="ts">
	import Carousel from '$lib/client/components/utils/Carousel.svelte';
	import Tooltip from './Tooltip.svelte';

	import { rentalImages } from '$lib/shared/demo';

	let { id, width, height }: { id: string; width: number; height: number } = $props();

	let idNumber = Number.parseInt(id);
</script>

<div class="body">
	<div class="carousel">
		<Carousel images={rentalImages} index={idNumber % rentalImages.length} />
	</div>
	<div class="tooltip">
		<Tooltip {id} width={width - 4} height={height - (width * 9) / 16} />
	</div>
</div>

<style lang="less">
	@gray: color-mix(in srgb, var(--map-style-background) 50%, #888 50%);

	.body {
		position: relative;
		display: flex;
		flex-direction: column;

		.carousel {
			width: calc(100% - 16px);
			aspect-ratio: 16 / 9;
			border-radius: 8px;
			margin: 8px;
			margin-bottom: 0px;
			overflow: hidden;
		}

		.tooltip {
			padding: 0px 2px;
		}
	}
</style>
