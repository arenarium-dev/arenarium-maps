<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '../../utils/Icon.svelte';

	let { id }: { id: string; lat: number; lng: number } = $props();

	let images = [
		'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1613545325278-f24b0cae1224?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1503174971373-b1f69850bded?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1502672023488-70e25813eb80?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1615873968403-89e068629265?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1618219740975-d40978bb7378?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1609347744425-175ecbd3cc0e?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1727706572437-4fcda0cbd66f?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1650137959510-d64eef290e86?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1600210491369-e753d80a41f3?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1637747018746-bece2b8a0309?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1505873242700-f289a29e1e0f?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1617104611622-d5f245d317f0?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1558882224-dda166733046?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1560185007-5f0bb1866cab?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1534595038511-9f219fe0c979?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1618221469555-7f3ad97540d6?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		'https://images.unsplash.com/photo-1675279200694-8529c73b1fd0?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8YXBhcnRtZW50JTIwaW50ZXJpb3J8ZW58MHwwfDB8fHwy',
		'https://images.unsplash.com/photo-1613575831056-0acd5da8f085?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8YXBhcnRtZW50JTIwaW50ZXJpb3J8ZW58MHwwfDB8fHwy',
		'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8YXBhcnRtZW50JTIwaW50ZXJpb3J8ZW58MHwwfDB8fHwy',
		'https://images.unsplash.com/photo-1665249934445-1de680641f50?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8YXBhcnRtZW50JTIwaW50ZXJpb3J8ZW58MHwwfDB8fHwy',
		'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8YXBhcnRtZW50JTIwaW50ZXJpb3J8ZW58MHwwfDB8fHwy',
		'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8YXBhcnRtZW50JTIwaW50ZXJpb3J8ZW58MHwwfDB8fHwy',
		'https://images.unsplash.com/photo-1667510436110-79d3dabc2008?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8YXBhcnRtZW50JTIwaW50ZXJpb3J8ZW58MHwwfDB8fHwy',
		'https://images.unsplash.com/photo-1612320648993-61c1cd604b71?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8YXBhcnRtZW50JTIwaW50ZXJpb3J8ZW58MHwwfDB8fHwy',
		'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGFwYXJ0bWVudCUyMGludGVyaW9yfGVufDB8MHwwfHx8Mg%3D%3D',
		'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGFwYXJ0bWVudCUyMGludGVyaW9yfGVufDB8MHwwfHx8Mg%3D%3D',
		'https://images.unsplash.com/photo-1585670149967-b4f4da88cc9f?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fGFwYXJ0bWVudCUyMGludGVyaW9yfGVufDB8MHwwfHx8Mg%3D%3D',
		'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGFwYXJ0bWVudCUyMGludGVyaW9yfGVufDB8MHwwfHx8Mg%3D%3D',
		'https://images.unsplash.com/photo-1617201929478-8eedff7508f9?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fGFwYXJ0bWVudCUyMGludGVyaW9yfGVufDB8MHwwfHx8Mg%3D%3D',
		'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGFwYXJ0bWVudCUyMGludGVyaW9yfGVufDB8MHwwfHx8Mg%3D%3D',
		'https://images.unsplash.com/photo-1650137938625-11576502aecd?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGFwYXJ0bWVudCUyMGludGVyaW9yfGVufDB8MHwwfHx8Mg%3D%3D'
	];
	let imageIndex = Number.parseInt(id) % images.length;

	let price = Math.min(2000, Math.floor(Number.parseInt(id) / 100) * 100 + 500);
	let beds = Math.floor(Math.random() * 3) + 1;
	let baths = Math.floor(Math.random() * 1) + 1;
	let area = Math.floor(Math.random() * 100) + 20;

	let mounted = $state<boolean>(false);

	onMount(async () => {
		await new Promise((resolve) => setTimeout(resolve, Math.random() * 500));
		mounted = true;
	});
</script>

{#if mounted}
	<button class="popup">
		<div class="image">
			<img loading="lazy" src={images[imageIndex]} alt={id} />
		</div>
		<div class="text">
			<div class="price">
				<span class="amount">{price}€ </span>
				<span> / mesečno</span>
			</div>
			<div class="details">
				<div class="beds">
					<Icon name="bed" size={16} />
					<span class="value">{beds}</span>
				</div>
				<div class="divider"></div>
				<div class="baths">
					<Icon name="bathtub" size={16} />
					<span class="value">{baths}</span>
				</div>
				<div class="divider"></div>
				<div class="area">
					<span class="value">{area} m<sup>2</sup></span>
				</div>
			</div>
		</div>
	</button>
{:else}
	<div class="placeholder">
		<div class="image"></div>
		<div class="text">
			<div class="price"></div>
			<div class="details"></div>
		</div>
	</div>
{/if}

<style lang="less">
	.popup {
		width: 128px;
		height: 104px;
		display: flex;
		flex-direction: column;
		padding: 4px;
		background-color: white;

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
				.baths,
				.area {
					display: flex;
					align-items: center;
					gap: 2px;
				}
			}
		}
	}

	.placeholder {
		width: 128px;
		height: 104px;
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
