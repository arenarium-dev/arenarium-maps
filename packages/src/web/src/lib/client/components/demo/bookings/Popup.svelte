<script lang="ts">
	import { onMount } from 'svelte';

	import { rentalImages } from '$lib/shared/demo';

	let { id, width, height }: { id: string; width: number; height: number } = $props();

	let fontSize = 1 + Math.min(width, height) / 10;

	let idNumber = Number.parseInt(id);

	let types = ['Apartment', 'House', 'Condo', 'Hotel'];
	let type = types[idNumber % types.length];
	let images = rentalImages;
	let imageIndex = idNumber % images.length;

	let price = 20 + Math.floor(idNumber / 100);
	let rating = Math.random() + 4;
	let votes = Math.floor(Math.max(100 - idNumber / 100, 1));
	let days = Math.floor(Math.random() * 2) + 1;

	let mounted = $state<boolean>(false);

	onMount(async () => {
		await new Promise((resolve) => setTimeout(resolve, Math.random() * 500));
		mounted = true;
	});
</script>

{#if mounted}
	<button class="popup" style:width={width + 'px'} style:height={height + 'px'} style:font-size={fontSize + 'px'}>
		<div class="image">
			<img loading="lazy" src={images[imageIndex]} alt={id} />
		</div>
		<div class="text">
			<div class="line top">
				<span class="type">{type}</span>
				<span class="star">★</span>
				<span class="rating">{rating.toFixed(1)} ({votes})</span>
			</div>
			<div class="line bottom">
				<span class="price">
					${price}
				</span>
				<span> for {days} night{days == 1 ? '' : 's'}</span>
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
		gap: 0px;
		padding: 4px;

		.image {
			width: 100%;
			aspect-ratio: 16 / 9;
			background-color: @gray;
			border-radius: 8px;
			overflow: hidden;
			cursor: pointer;

			img {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}
		}

		.text {
			display: flex;
			flex-direction: column;
			gap: 1px;
			padding: 2px 2px;
			color: var(--map-style-text);

			.line {
				height: 1.3em;
				display: flex;
				align-items: center;

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

					span {
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
		gap: 2px;
		padding: 4px;

		.image {
			width: 100%;
			aspect-ratio: 16 / 9;
			background-color: @gray;
			border-radius: 8px;
			overflow: hidden;
			cursor: pointer;
		}

		.text {
			display: flex;
			flex-direction: column;
			gap: 4px;

			.line {
				height: 1.3em;
				width: 100%;
				background-color: @gray;
				border-radius: 8px;
			}
		}
	}
</style>
