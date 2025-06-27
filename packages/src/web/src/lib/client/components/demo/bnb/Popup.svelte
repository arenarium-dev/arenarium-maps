<script lang="ts">
	import { onMount } from 'svelte';

	import Carousel from '$lib/client/components/utils/Carousel.svelte';

	import { rentalImages } from '$lib/shared/demo';

	let { id, width, height }: { id: string; width: number; height: number } = $props();

	let fontSize = 1 + Math.min(width, height) / 12;

	let idNumber = Number.parseInt(id);

	let types = ['Apartment', 'House', 'Condo', 'Hotel'];
	let type = types[idNumber % types.length];
	let images = rentalImages;
	let imageIndex = idNumber % images.length;

	let price = 20 + Math.round(idNumber / 10);
	let rating = Math.random() + 4;
	let votes = Math.round(Math.max(100 - idNumber / 100, 1));
	let days = Math.round(Math.random() * 4) + 1;

	let mounted = $state<boolean>(false);

	onMount(async () => {
		await new Promise((resolve) => setTimeout(resolve, Math.random() * 500));
		mounted = true;
	});
</script>

{#if mounted}
	<button class="popup" style:width={width + 'px'} style:height={height + 'px'} style:font-size={fontSize + 'px'}>
		<div class="image">
			<Carousel {images} index={imageIndex} dots={false} />
		</div>
		<div class="text">
			<div class="line top">
				<div class="type">{type}</div>
				<div class="star">★</div>
				<div class="rating">{rating.toFixed(1)} ({votes})</div>
			</div>
			<div class="line bottom">
				<div class="price">
					${price * days}
				</div>
				<div>for {days} night{days == 1 ? '' : 's'}</div>
			</div>
		</div>
	</button>
{:else}
	<div class="placeholder" style:width={width + 'px'} style:height={height + 'px'} style:font-size={fontSize + 'px'}>
		<div class="image"></div>
		<div class="text">
			<div class="line"></div>
			<div class="line"></div>
		</div>
	</div>
{/if}

<style lang="less">
	@gray: color-mix(in srgb, var(--map-style-background) 50%, #888 50%);

	.popup {
		display: flex;
		flex-direction: column;
		gap: 0.25em;
		padding: 0.5em;

		.image {
			width: 100%;
			aspect-ratio: 16 / 9;
			background-color: @gray;
			border-radius: 12px;
			overflow: hidden;
			cursor: pointer;
		}

		.text {
			width: 100%;
			display: flex;
			flex-direction: column;
			gap: 0.3em;
			padding: 0.2em;
			color: var(--map-style-text);

			.line {
				display: flex;
				flex-direction: row;
				align-items: center;
				height: 1.3em;

				&.top {
					font-size: 1em;

					.type {
						font-weight: 600;
						flex-grow: 1;
						text-align: start;
					}

					.star {
						font-size: 1.3em;
						line-height: 1em;
						padding-right: 0.1em;
					}

					.rating {
						font-weight: 500;
					}
				}

				&.bottom {
					font-size: 0.9m;

					div {
						opacity: 0.8;
					}

					.price {
						font-weight: 600;
						padding-right: 0.4em;
						opacity: 1;
					}
				}
			}
		}
	}

	.placeholder {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 8px;

		.image {
			width: 100%;
			aspect-ratio: 16 / 9;
			background-color: @gray;
			border-radius: 12px;
			overflow: hidden;
			cursor: pointer;
		}

		.text {
			display: flex;
			flex-direction: column;
			gap: 4px;
			padding: 2px 2px;

			.line {
				height: 1.3em;
				width: 100%;
				background-color: @gray;
				border-radius: 8px;
			}
		}
	}
</style>
