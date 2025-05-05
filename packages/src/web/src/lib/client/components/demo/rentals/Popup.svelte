<script lang="ts">
	import { app } from '$lib/client/state/app.svelte';
	import { onMount } from 'svelte';

	let { id }: { id: string } = $props();

	let mounted = $state<boolean>(false);

	onMount(() => {
		mounted = true;
	});

	let images = [
		'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=260&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1613545325278-f24b0cae1224?q=80&w=267&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1503174971373-b1f69850bded?q=80&w=271&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1502672023488-70e25813eb80?q=80&w=256&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=268&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1615873968403-89e068629265?q=80&w=266&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1618219740975-d40978bb7378?q=80&w=260&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1609347744425-175ecbd3cc0e?q=80&w=267&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1727706572437-4fcda0cbd66f?q=80&w=267&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1650137959510-d64eef290e86?q=80&w=257&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1600210491369-e753d80a41f3?q=80&w=257&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1637747018746-bece2b8a0309?q=80&w=267&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?q=80&w=267&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=267&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1505873242700-f289a29e1e0f?q=80&w=267&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1617104611622-d5f245d317f0?q=80&w=268&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1558882224-dda166733046?q=80&w=266&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?q=80&w=267&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?q=80&w=267&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1560185007-5f0bb1866cab?q=80&w=267&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1534595038511-9f219fe0c979?q=80&w=267&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
	];
	let imageIndex = Number.parseInt(id) % images.length;

	let price = Number.parseInt(id) * 10;

	let beds = Math.floor(Math.random() * 3) + 1;
	let baths = Math.floor(Math.random() * 2) + 1;
	let sqft = Math.floor(Math.random() * 100) + 100;

	function onClick(e: Event) {
		e.preventDefault();
		e.stopPropagation();

		app.toast.set({
			text: `Popup ${id} clicked.`,
			severity: 'info'
		});
	}
</script>

<button class="popup" onclick={onClick}>
	<div class="image">
		{#if mounted}
			<img loading="lazy" src={images[imageIndex]} alt={id} />
		{/if}
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

<style lang="less">
	.popup {
		width: 150px;
		height: 150px;
		display: flex;
		flex-direction: column;
		padding: 4px;

		.image {
			width: 100%;
			aspect-ratio: 16 / 9;
			background-color: var(--surface-container);
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

			.price {
				display: flex;
				align-items: center;
				gap: 4px;
				color: var(--on-surface);
				font-weight: 600;
				font-size: 16px;
			}

			.details {
				display: flex;
				flex-direction: row;
				align-items: start;
				gap: 4px;
				font-weight: 400;
				font-size: 12px;

				.beds,
				.baths,
				.sqft {
					display: flex;
					align-items: center;
					gap: 4px;
				}
			}
		}
	}
</style>
