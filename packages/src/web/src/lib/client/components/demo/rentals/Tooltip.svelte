<script lang="ts">
	import { onMount } from 'svelte';

	import { rentalImages } from '$lib/shared/demo';

	let { id, width, height }: { id: string; width: number; height: number } = $props();

	let fontSize = 2 + Math.min(width, height) / 10;

	let images = rentalImages;
	let imageIndex = Number.parseInt(id) % images.length;

	let price = Number.parseInt(id) * 10;
	let beds = Math.floor(Math.random() * 3) + 1;
	let baths = Math.floor(Math.random() * 2) + 1;
	let sqft = Math.floor(Math.random() * 100) + 100;

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
			<div class="price">
				<span class="amount">${price}</span>
			</div>
			<div class="details">
				<div class="beds">
					<span class="value">{beds}</span>
					<span class="label">bd</span>
				</div>
				<span class="divider">|</span>
				<div class="baths">
					<span class="value">{baths}</span>
					<span class="label">ba</span>
				</div>
				<span class="divider">|</span>
				<div class="sqft">
					<span class="value">{sqft}</span>
					<span class="label">sqft</span>
				</div>
			</div>
		</div>
	</button>
{:else}
	<div class="placeholder" style:width={width + 'px'} style:height={height + 'px'} style:font-size={fontSize + 'px'}>
		<div class="image"></div>
		<div class="text">
			<div class="price"></div>
			<div class="details"></div>
		</div>
	</div>
{/if}

<style lang="less">
	@gray: color-mix(in srgb, var(--map-style-background) 50%, #888 50%);

	.popup {
		display: flex;
		flex-direction: column;
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
			gap: 0px;
			padding: 2px 2px;
			color: var(--map-style-text);

			.price {
				display: flex;
				align-items: center;
				font-weight: 600;
				font-size: 1.1em;
			}

			.details {
				display: flex;
				flex-direction: row;
				align-items: start;
				gap: 3px;
				font-weight: 500;
				font-size: 0.8em;

				.beds,
				.baths,
				.sqft {
					display: flex;
					align-items: center;
					gap: 2px;
				}
			}
		}
	}

	.placeholder {
		display: flex;
		flex-direction: column;
		gap: 4px;
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

			.price {
				height: 1.3em;
				width: 100px;
				background-color: @gray;
				border-radius: 8px;
			}

			.details {
				height: 1em;
				width: 100%;
				background-color: @gray;
				border-radius: 8px;
			}
		}
	}
</style>
