<script lang="ts">
	import { onMount } from 'svelte';

	import Icon from './components/Icon.svelte';

	import { mountMap } from '$lib/index.js';
	import type { MapBounds, MapPopup } from '$lib/map/input.js';

	import { PUBLIC_API_KEY_DEV_VALUE } from '$env/static/public';

	let map: ReturnType<typeof mountMap>;

	let loading = $state<boolean>(false);
	let zoom = $state<number>(0);

	onMount(() => {
		map = mountMap({
			apiKey: PUBLIC_API_KEY_DEV_VALUE,
			container: 'map',
			position: {
				center: { lat: 51.505, lng: -0.09 },
				zoom: 4
			},
			// restriction: {
			// 	minZoom: 10,
			// 	maxZoom: 18,
			// 	maxBounds: {
			// 		sw: { lat: 51.505, lng: -0.09 },
			// 		ne: { lat: 54.505, lng: 3.09 }
			// 	}
			// },
			style: {
				name: 'light',
				colors: {
					background: 'white',
					primary: 'purple',
					text: 'black'
				}
			}
		});

		map.on('loading_start', () => {
			loading = true;
		});

		map.on('loading_end', () => {
			loading = false;
		});

		map.on('move', (e) => {
			zoom = e.zoom;
		});

		map.on('idle', () => {
			// console.log('idle');
		});

		map.on('popup_click', (id) => {
			alert(`Popup ${id} clicked`);
		});
	});

	function changeStyle() {
		const style = map.getStyle();

		if (style.name === 'light') {
			map.setStyle({
				name: 'dark',
				colors: {
					background: 'lightgray',
					primary: 'violet',
					text: 'black'
				}
			});
		}

		if (style.name === 'dark') {
			map.setStyle({
				name: 'light',
				url: 'https://tiles.openfreemap.org/styles/liberty',
				colors: {
					background: 'white',
					primary: 'red',
					text: 'black'
				}
			});
		}

		if (style.url != undefined) {
			map.setStyle({
				name: 'light',
				colors: {
					background: 'white',
					primary: 'violet',
					text: 'black'
				}
			});
		}
	}

	async function addData() {
		map.updatePopupContentCallback(getPopupContent);

		const bounds = map.getBounds();
		const popups = await getPopups(bounds);

		const now = performance.now();
		await map.updatePopups(popups);
		console.log(`[SET ${popups.length}] ${performance.now() - now}ms`);
	}

	async function clearData() {
		map.removePopups();
	}

	const zoomDelta = 0.05;

	function onZoomIn() {
		map.setZoom(map.getZoom() + zoomDelta);
	}

	function onZoomOut() {
		map.setZoom(map.getZoom() - zoomDelta);
	}

	//#region Data

	const total = 1000;
	const limit = 1000;

	const added = new Array<boolean>();
	added.fill(false);

	const radius = 10;
	const centers = [
		{ lat: 51.505, lng: -0.09 },
		{ lat: 45, lng: 22 },
		{ lat: 52.52, lng: 13.409 },
		{ lat: 48.8566, lng: 2.3522 }
	];

	async function getPopups(bounds: MapBounds): Promise<MapPopup[]> {
		const popups = new Array<MapPopup>();

		let n = 0;
		for (let i = 0; i < total; i++) {
			if (added[i]) continue;

			const distance = radius / i;
			const center = centers[i % centers.length];

			const lat = center.lat + distance * (-1 + random() * 2);
			const lng = center.lng + distance * (-1 + random() * 2);
			if (lat < bounds.sw.lat || bounds.ne.lat < lat || lng < bounds.sw.lng || bounds.ne.lng < lng) continue;
			if (n >= limit) break;

			n++;
			added[i] = true;

			const rank = Math.floor(random() * total);
			popups.push({
				id: rank.toString(),
				rank: rank,
				lat: lat,
				lng: lng,
				height: 100,
				width: 150
			});
		}

		return await new Promise((resolve) => resolve(popups));
	}

	async function getPopupContent(id: string): Promise<HTMLElement> {
		return await new Promise((resolve) => {
			const element = document.createElement('div');
			element.style.width = '200px';
			element.style.height = '150px';
			element.style.color = 'red';
			element.style.padding = '8px';
			element.innerText = id;
			resolve(element);
		});
	}

	let randomPrev = 1;

	function random() {
		const val = (randomPrev * 16807) % 2147483647;
		randomPrev = val;
		return val / 2147483647;
	}

	//#endregion
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" />
	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700;900&display=swap" />
	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded" />
</svelte:head>

<div id="map"></div>

<div class="buttons">
	<button class="style" onclick={changeStyle}>Change style</button>
	<button class="data" onclick={addData}>Add data</button>
	<button class="data" onclick={clearData}>Clear data</button>
</div>

<div class="zooms">
	<div>{zoom.toFixed(2)}</div>
	<button class="button" onmousedown={onZoomIn}>
		<Icon name={'add'} />
	</button>
	<button class="button" onmousedown={onZoomOut}>
		<Icon name={'remove'} />
	</button>
</div>

{#if loading}
	<div class="loading">Loading...</div>
{/if}

<style lang="less">
	#map {
		position: fixed;
		top: 0px;
		left: 0px;
		width: 100%;
		height: 100%;
	}

	.buttons {
		position: fixed;
		bottom: 40px;
		left: 20px;
		display: flex;
		gap: 8px;
	}

	button {
		padding: 8px 16px;
		border-radius: 8px;
		background-color: white;
		color: black;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
	}

	.zooms {
		position: fixed;
		bottom: 40px;
		right: 12px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;

		.button {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 36px;
			height: 36px;
			border-radius: 18px;
			color: red;
			background-color: green;
			transition: all ease-in-out 125ms;
			outline: none;
			border: none;
			cursor: pointer;
			box-shadow:
				0 0 4px 2px rgb(from var(--shadow) r g b / 0.2),
				0 3px 6px rgb(from var(--shadow) r g b / 0.3);
		}
	}

	.loading {
		position: fixed;
		top: 0px;
		left: 0px;
		background-color: rgba(0, 0, 0, 0.5);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 24px;
		font-weight: 500;
	}
</style>
