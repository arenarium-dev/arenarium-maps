<script lang="ts">
	import { mount, onMount, tick } from 'svelte';

	import Icon from './components/Icon.svelte';
	import TooltipComponent from './components/Tooltip.svelte';
	import PopupComponent from './components/Popup.svelte';

	import { MapManager } from '$lib/main.js';
	import type { MapMarker, MapProvider } from '$lib/main.js';

	let Mode = {
		MapLibre: 'maplibre',
		Google: 'google'
	};
	let mode: string = Mode.MapLibre;

	let mapElement: HTMLElement;
	let mapProvider: MapProvider;
	let mapManager: MapManager;

	let mapMarkers = new Map<string, MapMarker>();

	let loading = $state<boolean>(false);
	let zoom = $state<number>(0);

	onMount(async () => {
		switch (mode) {
			case 'maplibre': {
				await loadMapLibre();
				break;
			}
			case 'google': {
				await loadGoogleMaps();
				break;
			}
		}

		mapManager = new MapManager('KEY', mapProvider);
	});

	//#region MapLibre

	import { MapLibreProvider, MapLibreLightStyle } from '$lib/maplibre.js';

	let mapLibre: maplibregl.Map;

	async function loadMapLibre() {
		const maplibregl = await import('maplibre-gl');
		await import('maplibre-gl/dist/maplibre-gl.css');

		const mapLibreProvider = new MapLibreProvider(maplibregl.Map, maplibregl.Marker, {
			container: mapElement,
			style: MapLibreLightStyle,
			center: { lat: 51.505, lng: -0.09 },
			zoom: 4
		});

		mapProvider = mapLibreProvider;

		mapLibre = mapLibreProvider.getMap();
		mapLibre.on('move', (e) => {
			zoom = mapLibre.getZoom();
		});
		mapLibre.on('click', (e) => {
			onMapClick();
		});
	}

	//#endregion

	//#region Google Maps

	import { GoogleMapsProvider, GoogleMapLightStyle, GoogleMapDarkStyle } from '../lib/google.js';

	import { Loader } from '@googlemaps/js-api-loader';

	let mapGoogle: google.maps.Map;
	let mapOverlayView: google.maps.OverlayView;

	let mapTypeLightId = 'light-id';
	let mapTypeDarkId = 'dark-id';

	async function loadGoogleMaps() {
		const loader = new Loader({
			apiKey: 'AIzaSyCt6ERDLY4Hx5b6LEBQFPYJbRq9teByXyk',
			version: 'weekly'
		});

		const mapsLibrary = await loader.importLibrary('maps');
		const markerLibrary = await loader.importLibrary('marker');

		const googleMapsProvider = new GoogleMapsProvider(mapsLibrary.Map, markerLibrary.AdvancedMarkerElement, mapElement, {
			mapId: '11b85640a5094a146ed5dd8f',
			center: { lat: 51.505, lng: -0.09 },
			zoom: 4,
			disableDefaultUI: true,
			isFractionalZoomEnabled: true
		});

		mapProvider = googleMapsProvider;

		mapGoogle = googleMapsProvider.getMap();
		mapGoogle.addListener('zoom_changed', () => {
			zoom = mapGoogle.getZoom()!;
		});
		mapGoogle.addListener('click', () => {
			onMapClick();
		});

		mapOverlayView = new mapsLibrary.OverlayView();
		mapOverlayView.setMap(mapGoogle);

		const mapTypeLight = new google.maps.StyledMapType(GoogleMapLightStyle, { name: 'Light Map' });
		const mapTypeDark = new google.maps.StyledMapType(GoogleMapDarkStyle, { name: 'Dark Map' });

		mapGoogle.mapTypes.set(mapTypeLightId, mapTypeLight);
		mapGoogle.mapTypes.set(mapTypeDarkId, mapTypeDark);

		mapGoogle.setMapTypeId(mapTypeLightId); //'roadmap'
	}

	//#endregion

	interface Bounds {
		sw: { lat: number; lng: number };
		ne: { lat: number; lng: number };
	}

	function getBounds(): Bounds {
		switch (mode) {
			case 'maplibre': {
				const bounds = mapLibre.getBounds();
				return { sw: { lat: bounds._sw.lat, lng: bounds._sw.lng }, ne: { lat: bounds._ne.lat, lng: bounds._ne.lng } };
			}
			case 'google': {
				const bounds = mapGoogle.getBounds();
				return {
					sw: { lat: bounds?.getSouthWest().lat() ?? 0, lng: bounds?.getSouthWest().lng() ?? 0 },
					ne: { lat: bounds?.getNorthEast().lat() ?? 0, lng: bounds?.getNorthEast().lng() ?? 0 }
				};
			}
			default: {
				throw new Error('Invalid mode');
			}
		}
	}

	async function addData() {
		const bounds = getBounds();
		const markers = await getMarkers(bounds);

		markers.forEach((m) => mapMarkers.set(m.id, m));
		await tick();

		const now = performance.now();
		await mapManager.updateMarkers(markers);
		console.log(`[UPDATE MARKERS ${markers.length}] ${performance.now() - now}ms`);
	}

	async function clearData() {
		mapMarkers.clear();
		mapManager.removeMarkers();
	}

	let toggled = false;

	async function toggleData() {
		toggled = !toggled;
		const states = Array.from(mapMarkers.values()).map((m) => ({ id: m.id, toggled: toggled }));
		// mapManager.togglePopups(states);
	}

	const zoomDelta = 0.05;

	function onZoomIn() {
		switch (mode) {
			case 'maplibre': {
				mapLibre.setZoom(mapLibre.getZoom() + zoomDelta);
				break;
			}
			case 'google': {
				mapGoogle.setZoom(mapGoogle.getZoom()! + zoomDelta);
				break;
			}
		}
	}

	function onZoomOut() {
		switch (mode) {
			case 'maplibre': {
				mapLibre.setZoom(mapLibre.getZoom() - zoomDelta);
				break;
			}
			case 'google': {
				mapGoogle.setZoom(mapGoogle.getZoom()! - zoomDelta);
				break;
			}
		}
	}

	function onMapClick() {
		console.log('Map click');
		mapManager.hidePopup();
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

	async function getMarkers(bounds: Bounds): Promise<MapMarker[]> {
		const markers = new Array<MapMarker>();

		let count = 0;
		let index = 0;

		while (count < limit && index < total) {
			const lat = lats[index];
			const lng = lngs[index];
			const rank = ranks[index];
			index++;

			if (lat < bounds.sw.lat || bounds.ne.lat < lat || lng < bounds.sw.lng || bounds.ne.lng < lng) continue;
			count++;

			markers.push({
				id: index.toString(),
				rank: rank,
				lat: lat,
				lng: lng,
				tooltip: {
					style: {
						height: 24,
						width: 36,
						margin: 4,
						radius: 6
					},
					body: getTooltipBody
				},
				pin: {
					style: {
						width: 16,
						height: 16,
						radius: 4
					},
					body: getPinBody
				},
				popup: {
					style: {
						width: 150,
						height: 100,
						radius: 12,
						margin: 4
					},
					body: getPopupBody
				}
			});
		}

		return await new Promise((resolve) => resolve(markers));
	}

	function onTooltipClick(id: string) {
		mapManager.showPopup(id);
	}

	async function getTooltipBody(id: string): Promise<HTMLElement> {
		return await new Promise((resolve) => {
			const marker = mapMarkers.get(id);
			if (marker == undefined) throw new Error('Failed to get marker');

			const element = document.createElement('div');
			element.addEventListener('click', (e) => {
				e.stopPropagation();
				onTooltipClick(id);
			});

			mount(TooltipComponent, { target: element, props: { id: id, marker: marker } });
			resolve(element);
		});
	}

	async function getPinBody(id: string): Promise<HTMLElement> {
		return await new Promise((resolve) => {
			const marker = mapMarkers.get(id);
			if (marker == undefined) throw new Error('Failed to get marker');

			const element = document.createElement('div');

			// if (Number.parseInt(id) % 10 <= 3) {
			// 	element.style.display = 'flex';
			// 	element.style.padding = '2px';
			// 	mount(Icon, { target: element, props: { name: 'location_on', size: 16, color: 'white' } });
			// } else if (Number.parseInt(id) % 10 <= 6) {
			// 	element.style.color = 'white';
			// 	element.style.fontSize = '12px';
			// 	element.style.fontWeight = '600';
			// 	element.style.padding = '2px 6px';
			// 	element.innerHTML = '$' + id + '0';
			// }

			resolve(element);
		});
	}

	async function getPopupBody(id: string): Promise<HTMLElement> {
		return await new Promise((resolve) => {
			const marker = mapMarkers.get(id);
			if (marker == undefined) throw new Error('Failed to get marker');

			const element = document.createElement('div');
			mount(PopupComponent, { target: element, props: { id: id, marker: marker } });
			resolve(element);
		});
	}

	//#endregion

	//#region Wasm

	import { wasm } from '@workspace/shared/wasm/compute/states.js';

	function runWasm() {
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
	}

	//#endregion
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" />
	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700;900&display=swap" />
	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded" />
</svelte:head>

<div class="map" bind:this={mapElement}></div>

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
	.map {
		--arenarium-maps-tooltip-background: white;
		--arenarium-maps-pin-background: purple;

		position: absolute;
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
		.marker {
			--arenarium-maps-marker-shadow: 0px 2px 2px rgba(0, 0, 0, 0.5);
		}
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
