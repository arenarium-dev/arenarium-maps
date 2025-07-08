<script lang="ts">
	import Carousel from '$lib/client/components/utils/Carousel.svelte';

	import { rentalImages } from '$lib/shared/demo';

	let { id, width, height }: { id: string; width: number; height: number } = $props();

	let fontSize = Math.min(width, height) / 15;

	let idNumber = Number.parseInt(id);
	let types = ['Apartment', 'Hotel', 'Hotel', 'Hotel'];
	let type = types[idNumber % types.length];
	let price = 20 + Math.floor(idNumber / 10);
	let rating = 9 + (idNumber % 10) * 0.1;
	let days = 1 + (idNumber % 3);
	let guests = 1 + (idNumber % 2);
</script>

<div class="body" style:font-size={fontSize + 'px'} style:width={width + 'px'} style:height={height + 'px'}>
	<div class="carousel">
		<Carousel images={rentalImages} index={idNumber % rentalImages.length} />
	</div>
	<div class="tooltip">
		<div class="line top">
			<div class="type">{type}</div>
			<div class="rating">{rating.toFixed(1)}</div>
		</div>
		<div class="price">
			${price * days}
		</div>
		<div class="line bottom">
			<div>{days} night{days == 1 ? '' : 's'}</div>
			<div>{guests} guest{guests == 1 ? '' : 's'}</div>
		</div>
	</div>
</div>

<style lang="less">
	@gray: color-mix(in srgb, var(--map-style-background) 50%, #888 50%);

	.body {
		position: relative;
		display: flex;
		flex-direction: column;
		padding: 0.75em;
		gap: 0.5em;

		.carousel {
			width: 100%;
			flex-grow: 1;
			border-radius: 0.75em;
			overflow: hidden;
		}

		.tooltip {
			.price {
				font-weight: 600;
				font-size: 1.5em;
				opacity: 1;
			}

			.line {
				width: 100%;
				display: flex;
				flex-direction: row;
				align-items: center;
				height: 1.3em;

				&.top {
					line-height: 1.3em;
					font-size: 1em;

					.type {
						font-weight: 600;
						flex-grow: 1;
						text-align: start;
						opacity: 0.8;
						color: var(--map-style-primary);
					}

					.rating {
						font-weight: 500;
						background-color: var(--map-style-primary);
						color: var(--map-style-background);
						border-radius: 0.5em 0.5em 0.5em 0px;
						padding: 0.2em 0.5em;
						padding-top: 0.2em;
					}
				}

				&.bottom {
					font-size: 1em;
					gap: 0.5em;

					div {
						opacity: 0.8;
					}
				}
			}
		}
	}
</style>
