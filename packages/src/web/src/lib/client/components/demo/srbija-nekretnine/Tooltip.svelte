<script lang="ts">
	import { onMount } from 'svelte';

	import Icon from '$lib/client/components/utils/Icon.svelte';

	import { Fetch } from '$lib/client/core/fetch';
	import { Demo } from '$lib/shared/demo';

	let { id, width, height }: { id: string; width: number; height: number } = $props();

	let url = $state<string>('');
	let image = $state<string>('');
	let price = $state<string>('');
	let priceTime = $state<string>('');
	let title = $state<string>('');
	let beds = $state<number>(0);
	let baths = $state<number>(0);

	let mounted = $state<boolean>(false);

	onMount(async () => {
		const data = await Fetch.that<any>(`/api/tooltip/details?demo=${Demo.SrbijaNekretnine}&id=${id}`);
		url = data.url;
		image = data.image;
		price = data.price;
		priceTime = data.priceTime;
		title = data.title;
		beds = data.beds;
		baths = data.baths;

		mounted = true;
	});
</script>

{#if mounted}
	<a class="popup" style:width={width + 'px'} style:height={height + 'px'} href={url} target="_blank">
		<div class="image">
			<img loading="lazy" src={image} alt={id} />
		</div>
		<div class="text">
			<div class="price">
				<span class="amount">{price} </span>
				<span> / {priceTime}</span>
			</div>
			<div class="details">
				<div class="title">
					<span class="value">{@html title}</span>
				</div>
				{#if beds}
					<div class="divider"></div>
					<div class="beds">
						<div class="icon">
							<Icon name="bed" size={16} />
						</div>
						<span class="value">{beds}</span>
					</div>
				{/if}
				{#if baths}
					<div class="divider"></div>
					<div class="baths">
						<div class="icon">
							<Icon name="bathtub" size={16} />
						</div>
						<span class="value">{baths}</span>
					</div>
				{/if}
			</div>
		</div>
	</a>
{:else}
	<div class="placeholder" style:width={width + 'px'} style:height={height + 'px'}>
		<div class="image"></div>
		<div class="text">
			<div class="price"></div>
			<div class="details"></div>
		</div>
	</div>
{/if}

<style lang="less">
	.popup {
		display: flex;
		flex-direction: column;
		padding: 4px;
		background-color: white;
		font-family: sans-serif;

		.image {
			width: 100%;
			aspect-ratio: 16 / 9;
			border-radius: 8px;
			background-color: lightgray;
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

			.price {
				display: flex;
				align-items: center;
				gap: 4px;
				color: black;
				font-size: 12px;

				.amount {
					font-weight: 600;
					font-size: 14px;
				}
			}

			.details {
				height: 18px;
				display: flex;
				flex-direction: row;
				align-items: end;
				gap: 6px;
				font-size: 11px;
				font-weight: 500;
				color: black;

				.divider {
					width: 1px;
					height: 90%;
					background-color: gray;
					opacity: 0.6;
				}

				.beds,
				.baths {
					display: flex;
					align-items: center;
					gap: 2px;

					.icon {
						height: 14px;
					}
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
			background-color: lightgray;
			border-radius: 8px;
			overflow: hidden;
			cursor: pointer;
		}

		.text {
			display: flex;
			flex-direction: column;
			gap: 4px;

			.price {
				height: 18px;
				width: 100px;
				background-color: lightgray;
				border-radius: 8px;
			}

			.details {
				height: 16px;
				width: 100%;
				background-color: lightgray;
				border-radius: 8px;
			}
		}
	}
</style>
