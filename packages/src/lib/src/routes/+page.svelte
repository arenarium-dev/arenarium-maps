<script lang="ts">
	import { mount, onMount, tick } from 'svelte';

	import Icon from './components/Icon.svelte';
	import PopupComponent from './components/Popup.svelte';

	import { MapManager } from '$lib/main.js';
	import { MapLibreProvider, MapStyleLight } from '$lib/maplibre.js';
	import type { MapPopup, MapPopupData, MapPopupState } from '$lib/main.js';

	import { getStates } from '@workspace/shared/src/popup/compute/states.js';
	import { testStates } from '@workspace/shared/src/popup/compute/test.js';

	import { wasm } from '@workspace/shared/wasm/compute/states.js';

	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';

	let mapContainer: HTMLElement;
	let mapLibre: maplibregl.Map;

	let mapProvider: MapLibreProvider;
	let mapManager: MapManager;

	let mapPopups = new Map<string, MapPopup>();

	let loading = $state<boolean>(false);
	let zoom = $state<number>(0);

	onMount(() => {
		mapProvider = new MapLibreProvider(maplibregl.Map, maplibregl.Marker, {
			container: mapContainer,
			style: MapStyleLight,
			center: { lat: 51.505, lng: -0.09 },
			zoom: 4
		});

		mapLibre = mapProvider.getMap();
		mapLibre.on('move', (e) => {
			zoom = mapLibre.getZoom();
		});

		mapManager = new MapManager(mapProvider);
		mapManager.setColors('purple', 'white', 'black');

		const wasmBinaryString = atob(wasm);
		const wasmBytes = new Uint8Array(wasmBinaryString.length);
		for (let i = 0; i < wasmBinaryString.length; i++) {
			wasmBytes[i] = wasmBinaryString.charCodeAt(i);
		}

		const wasmImportObject = {};
		// create a wasm module
		const wasmModule = new WebAssembly.Module(wasmBytes);
		// create a new instance of our wasm module
		const wasmInstance = new WebAssembly.Instance(wasmModule, wasmImportObject);
		// store the exported functions that are in our wasm instance
		const exports = wasmInstance.exports as {
			createPopupsArray: (length: number) => void;
			deletePopupsArray: () => void;
			addPopup: (index: number, rank: number, lat: number, lng: number, width: number, height: number) => void;
			runPopupSimulation: () => void;
		};

		try {
			exports.createPopupsArray(1);
			exports.addPopup(1, 1, 1, 1, 1, 1);
			exports.runPopupSimulation();
			exports.deletePopupsArray();
		} catch (error) {
			console.error(error);
		}
	});

	async function addData() {
		const bounds = mapLibre.getBounds();
		const popups = await getPopups(bounds);

		popups.forEach((popup) => mapPopups.set(popup.data.id, popup));
		await tick();

		const now = performance.now();
		await mapManager.updatePopups(popups);
		console.log(`[UPDATE POPUPS ${popups.length}] ${performance.now() - now}ms`);
	}

	async function clearData() {
		mapPopups.clear();
		mapManager.removePopups();
	}

	let toggled = false;

	async function toggleData() {
		toggled = !toggled;
		const states = Array.from(mapPopups.values()).map((popup) => ({ id: popup.data.id, toggled: toggled }));
		mapManager.togglePopups(states);
	}

	const zoomDelta = 0.05;

	function onZoomIn() {
		mapLibre.setZoom(mapLibre.getZoom() + zoomDelta);
	}

	function onZoomOut() {
		mapLibre.setZoom(mapLibre.getZoom() - zoomDelta);
	}

	//#region Data

	const total = 1000;
	const limit = 1000;

	let lats = new Array<number>();
	let lngs = new Array<number>();
	let ranks = new Array<number>();

	onMount(() => {
		const radius = 10;
		const centers = [
			{ lat: 51.505, lng: -0.09 }
			// { lat: 45, lng: 22 },
			// { lat: 52.52, lng: 13.409 },
			// { lat: 48.8566, lng: 2.3522 }
		];

		let randomPrev = 1;

		const random = () => {
			const val = (randomPrev * 16807) % 2147483647;
			randomPrev = val;
			return val / 2147483647;
		};

		for (let i = 0; i < total; i++) {
			const distance = radius / i;
			const center = centers[i % centers.length];

			const lat = center.lat + distance * (-1 + random() * 2);
			const lng = center.lng + distance * (-1 + random() * 2);

			lats.push(lat);
			lngs.push(lng);

			const rank = Math.floor(random() * total);
			ranks.push(rank);
		}
	});

	async function getPopups(bounds: maplibregl.LngLatBounds): Promise<MapPopup[]> {
		const data = new Array<MapPopupData>();

		let count = 0;
		let index = 0;

		while (count < limit && index < total) {
			const lat = lats[index];
			const lng = lngs[index];
			const rank = ranks[index];
			index++;

			if (lat < bounds._sw.lat || bounds._ne.lat < lat || lng < bounds._sw.lng || bounds._ne.lng < lng) continue;
			count++;

			data.push({
				id: index.toString(),
				rank: rank,
				lat: lat,
				lng: lng,
				height: 100,
				width: 150,
				padding: 8
			});
		}

		const popups = new Array<MapPopup>(data.length);

		let now = performance.now();
		const states = await getPopupStates(data);
		console.log(`[STATES CALCULATION ${data.length}] ${performance.now() - now}ms`);

		now = performance.now();
		testStates(mapProvider.parameters, data, states);
		console.log(`[STATES TEST ${data.length}] ${performance.now() - now}ms`);

		for (let i = 0; i < data.length; i++) {
			popups[i] = {
				data: data[i],
				state: states[i],
				callbacks: {
					body: getPopupBody,
					pin: getPopupPin
				}
			};
		}

		return await new Promise((resolve) => resolve(popups));
	}

	async function getPopupStates(data: MapPopupData[]): Promise<MapPopupState[]> {
		if (import.meta.env.DEV) {
			switch (import.meta.env.MODE) {
				case 'browser': {
					return getStates(mapProvider.parameters, data);
				}
				default: {
					return await getStatesApi(data);
				}
			}
		} else {
			return await getStatesApi(data);
		}
	}

	async function getStatesApi(data: MapPopupData[]): Promise<MapPopupState[]> {
		const response = await fetch(`/api`, {
			method: 'POST',
			body: JSON.stringify({
				parameters: mapProvider.parameters,
				data: data
			})
		});

		if (!response.ok || !response.body) {
			throw new Error('Failed to get markers');
		}

		const states: MapPopupState[] = await response.json();
		return states;
	}

	async function getPopupBody(id: string): Promise<HTMLElement> {
		return await new Promise((resolve) => {
			const popup = mapPopups.get(id);
			if (popup == undefined) throw new Error('Failed to get popup');

			const element = document.createElement('div');
			mount(PopupComponent, { target: element, props: { id: id, popup: popup } });

			element.style.width = popup.data.width + 'px';
			element.style.height = popup.data.height + 'px';
			resolve(element);
		});
	}

	async function getPopupPin(id: string): Promise<HTMLElement> {
		return await new Promise((resolve) => {
			const popup = mapPopups.get(id);
			if (popup == undefined) throw new Error('Failed to get popup');

			if (Number.parseInt(id) % 10 <= 3) {
				const element = document.createElement('div');
				element.style.display = 'flex';
				element.style.padding = '2px';
				mount(Icon, { target: element, props: { name: 'location_on', size: 16, color: 'white' } });

				resolve(element);
			} else if (Number.parseInt(id) % 10 <= 6) {
				const element = document.createElement('div');
				element.style.color = 'white';
				element.style.fontSize = '12px';
				element.style.fontWeight = '600';
				element.style.padding = '2px 6px';
				element.innerHTML = '$' + id + '0';
				resolve(element);
			}
		});
	}

	//#endregion
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" />
	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700;900&display=swap" />
	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded" />
</svelte:head>

<div id="map" bind:this={mapContainer}></div>

<div class="buttons">
	<button class="data" onclick={addData}>Add data</button>
	<button class="data" onclick={clearData}>Clear data</button>
	<button class="data" onclick={toggleData}>Toggle data</button>
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

	:global {
		.maplibregl-map {
			z-index: 0;

			.maplibregl-ctrl-bottom-right {
				z-index: 10000000;

				.maplibregl-ctrl-attrib {
					background-color: color-mix(in srgb, var(--map-style-background) 50%, transparent 50%);
					color: var(--map-style-text);
					font-size: 10px;
					font-family: 'Roboto';
					font-weight: 500;
					line-height: normal;
					padding: 2px 5px;
					border-top-left-radius: 5px;
					box-shadow: -1px -1px 2px rgba(0, 0, 0, 0.2);

					.maplibregl-ctrl-attrib-inner {
						a {
							color: var(--map-style-text);
							font-weight: 600;
						}
					}
				}
			}
		}
	}
</style>
