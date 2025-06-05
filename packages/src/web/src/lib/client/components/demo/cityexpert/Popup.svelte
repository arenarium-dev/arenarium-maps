<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	import Icon from '$lib/client/components/utils/Icon.svelte';

	import { Fetch } from '$lib/client/core/fetch';
	import { Demo } from '$lib/shared/demo';

	let { id, width, height }: { id: string; width: number; height: number } = $props();

	let images = $state<string[]>([]);
	let imageIndex = $state<number>(0);

	let price = $state<number>(0);
	let type = $state<string>('');
	let size = $state<number>(0);
	let structure = $state<string>('');

	let mounted = $state<boolean>(false);

	onMount(async () => {
		const data = await Fetch.that<any>(`/api/popup/${Demo.CityExpert}/details/${id}`);
		images = data.images;
		images = images.map((i) => 'https://img.cityexpert.rs/sites/default/files/styles/470x/public/image/' + i);
		imageIndex = 0;

		price = Number.parseFloat(data.price);
		type = data.type;
		size = data.size;
		structure = data.structure;

		mounted = true;
	});

	function onImageLeft(e: MouseEvent) {
		e.stopPropagation();
		imageIndex = (imageIndex + images.length - 1) % images.length;
	}

	function onImageRight(e: MouseEvent) {
		e.stopPropagation();
		imageIndex = (imageIndex + images.length + 1) % images.length;
	}
</script>

{#if mounted}
	<div class="popup" style:width={width + 'px'} style:height={height + 'px'} transition:fade={{ duration: 250 }}>
		<div class="id">ID {id}</div>
		<button class="like">
			<Icon name="favorite" size={14} color="var(--primary)" weight="bold" />
		</button>
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
			<span class="amount">{price.toLocaleString().replace(',', '.')} €</span>
			<img class="type" loading="lazy" src="https://cityexpert.rs/icons/map/pin_{type}.png" alt={type} />
		</div>
		<div class="details">
			<div class="pill">
				<span>{size} m²</span>
			</div>
			<!-- <div class="divider">•</div> -->
			<div class="pill">
				<span>{structure}</span>
			</div>
			<div class="pill">
				<span>Namešten</span>
			</div>
		</div>
	</div>
{:else}
	<div class="placeholder" style:width={width + 'px'} style:height={height + 'px'} transition:fade={{ duration: 250 }}>
		<div class="image"></div>
		<div class="text">
			<div class="price"></div>
			<div class="details"></div>
		</div>
	</div>
{/if}

<style lang="less">
	@import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');

	.popup {
		--primary: #df2d43;
		--font-regular: 'Poppins', 'Montserrat', sans-serif;
		--font-secondary: 'Rubik', sans-serif;
		--font-numerical: 'Montserrat', sans-serif;
		--gray: rgb(244 245 246);

		position: absolute;
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 4px;
		background-color: white;
		font-family: sans-serif;

		.id {
			position: absolute;
			top: 9px;
			left: 9px;
			font-size: 10px;
			font-weight: 600;
			color: white;
		}

		.like {
			position: absolute;
			top: 8px;
			right: 8px;
			width: 20px;
			height: 20px;
			padding-top: 1px;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: 50%;
			font-size: 10px;
			font-weight: 600;
			background-color: white;
		}

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
				top: 52px;
				width: 20px;
				height: 20px;
				display: flex;
				align-items: center;
				justify-content: center;
				padding: 0px;
				border-radius: 50%;
				background-color: white;
				color: black;
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
			padding: 0px 4px;
			color: #252525;
			font-size: 12px;
			font-family: var(--font-regular);

			.amount {
				flex-grow: 1;
				font-weight: 700;
				font-size: 13px;
				font-family: var(--font-numerical);
			}

			.type {
				width: 20px;
				height: 20px;
				border-radius: 50%;
				overflow: hidden;
				object-fit: cover;
				object-position: 50% 1px;
			}
		}

		.details {
			display: flex;
			flex-direction: row;
			align-items: center;
			gap: 4px;
			font-size: 10px;
			font-weight: 600;
			font-family: var(--font-regular);
			color: #374151;

			.pill {
				text-wrap: nowrap;
				padding: 2px 6px;
				border-radius: 11px;
				background-color: var(--gray);
			}
		}
	}

	.placeholder {
		position: absolute;
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 4px;

		.image {
			width: 100%;
			aspect-ratio: 16 / 9;
			background-color: var(--gray);
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
				background-color: var(--gray);
				border-radius: 8px;
			}

			.details {
				height: 16px;
				width: 100%;
				background-color: var(--gray);
				border-radius: 8px;
			}
		}
	}
</style>
