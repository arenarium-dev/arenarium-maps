<script lang="ts">
	import Icon from '$lib/client/components/utils/Icon.svelte';

	let { id, width, height, data }: { id: string; width: number; height: number; data: any } = $props();

	let images = data.photos;
	let imageIndex = $state<number>(0);

	let name = data.name;
	let instant = data.instant;
	let parking = data.parking;
	let bedrooms = data.bedrooms;
	let guests = data.guests;
	let price = data.price;

	function onImageLeft(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		imageIndex = (imageIndex + images.length - 1) % images.length;
	}

	function onImageRight(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		imageIndex = (imageIndex + images.length + 1) % images.length;
	}
</script>

<a class="popup" style:width={width + 'px'} style:height={height + 'px'} href="https://bookaweb.com{data.url}" target="_blank">
	<div class="image">
		<img loading="lazy" src={images[imageIndex]} alt={id} />
		<button class="nav left" onclick={onImageLeft}>
			<Icon name="chevron_left" size={16} />
		</button>
		<button class="nav right" onclick={onImageRight}>
			<Icon name="chevron_right" size={16} />
		</button>
	</div>
	<div class="title">
		<span class="name truncate-text">{name}</span>
		{#if instant}
			<img class="instant" loading="lazy" src="https://bookaweb.com/img/icons-svg/instant.svg" alt="Instant" />
		{/if}
		{#if parking == 'free'}
			<img class="parking" loading="lazy" src="https://bookaweb.com/img/icons-svg/ad-card-parking.svg" alt="Parking" />
		{/if}
		{#if parking == 'garage'}
			<img class="parking" loading="lazy" src="https://bookaweb.com/img/icons-svg/parking-garage.svg" alt="Parking" />
		{/if}
	</div>
	<div class="details">
		<span class="price">€{price} </span>
		<span>noćenje</span>
		<span>·</span>
		<span>{guests}</span>
		<span>osobe</span>
	</div>
</a>

<style lang="less">
	.popup {
		position: absolute;
		display: flex;
		flex-direction: column;
		gap: 0px;
		padding: 4px;
		background-color: var(--map-style-background);
		font-family:
			Helvetica Neue,
			Helvetica,
			Arial,
			sans-serif;

		.image {
			width: 100%;
			aspect-ratio: 16 / 9;
			border-radius: 8px;
			background-color: var(--gray);
			overflow: hidden;
			cursor: pointer;

			img {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}

			.nav {
				opacity: 0;
				position: absolute;
				top: 36px;
				width: 20px;
				height: 20px;
				display: flex;
				align-items: center;
				justify-content: center;
				padding: 0px;
				border-radius: 50%;
				background-color: var(--map-style-background);
				color: var(--map-style-text);
				font-weight: 600;
				cursor: pointer;
				transition: opacity ease-in-out 125ms;
			}

			.nav.left {
				left: 8px;
				padding-right: 1px;
			}

			.nav.right {
				right: 8px;
				padding-left: 1px;
			}

			&:hover {
				.nav {
					opacity: 0.5;
				}
			}
		}

		.title {
			display: flex;
			align-items: center;
			gap: 4px;
			padding: 0px 4px;
			padding-top: 4px;
			color: var(--map-style-text);
			font-size: 12px;

			.name {
				flex-grow: 1;
				font-weight: 600;
				font-size: 13px;
			}

			img {
				width: 16px;
				height: 16px;
			}
		}

		.details {
			display: flex;
			flex-direction: row;
			align-items: center;
			gap: 3px;
			padding: 0px 4px;
			color: var(--map-style-text);
			font-size: 12px;

			.price {
				font-weight: 600;
			}
		}
	}
</style>
