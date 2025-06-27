<script lang="ts">
	import Carousel from '$lib/client/components/utils/Carousel.svelte';
	import Tooltip from './Tooltip.svelte';

	import { rentalImages } from '$lib/shared/demo';

	let { id, width, height }: { id: string; width: number; height: number } = $props();

	let tooltipWidth = width - 4;
	let tooltipHeight = height - (width * 9) / 16;
	let fontSize = Math.min(width, height) / 6;

	let idNumber = Number.parseInt(id);
</script>

<div class="body" style:font-size={fontSize + 'px'}>
	<div class="carousel">
		<Carousel images={rentalImages} index={idNumber % rentalImages.length} />
	</div>
	<div class="tooltip">
		<Tooltip {id} width={tooltipWidth} height={tooltipHeight} />
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
			border-radius: 12px;
			margin: 8px;
			margin-bottom: 0px;
			overflow: hidden;
		}

		.tooltip {
			padding: 0px 2px;
			padding-bottom: 2px;
		}
	}
</style>
