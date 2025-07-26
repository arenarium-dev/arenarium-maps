<script lang="ts">
	import { mount, onMount, tick } from 'svelte';

	import Icon from './components/Icon.svelte';
	import TooltipComponent from './components/Tooltip.svelte';
	import PopupComponent from './components/Popup.svelte';

	import { MapManager } from '$lib/main.js';
	import type { MapMarker, MapProvider } from '$lib/main.js';

	let Mode = {
		MapLibre: 'maplibre',
		MapBox: 'mapbox',
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
				await loadMaplibre();
				break;
			}
			case 'mapbox': {
				await loadMapbox();
				break;
			}
			case 'google': {
				await loadGoogle();
				break;
			}
		}

		mapManager = new MapManager(mapProvider);
	});

	//#region MapLibre

	import { MaplibreProvider, MaplibreLightStyle } from '$lib/maplibre.js';

	let maplibre: maplibregl.Map;

	async function loadMaplibre() {
		const maplibregl = await import('maplibre-gl');
		await import('maplibre-gl/dist/maplibre-gl.css');

		const mapLibreProvider = new MaplibreProvider(maplibregl.Map, maplibregl.Marker, {
			container: mapElement,
			style: MaplibreLightStyle,
			center: { lat: 51.505, lng: -0.09 },
			zoom: 4
		});

		mapProvider = mapLibreProvider;

		maplibre = mapLibreProvider.getMap();
		maplibre.on('move', (e) => {
			zoom = maplibre.getZoom();
		});
		maplibre.on('click', (e) => {
			onMapClick();
		});
	}

	//#endregion

	//#region MapBox

	import { MapboxProvider } from '$lib/mapbox.js';

	import { PUBLIC_MAP_BOX_API_KEY } from '$env/static/public';

	let mapbox: mapboxgl.Map;

	async function loadMapbox() {
		const mapboxgl = await import('mapbox-gl');
		await import('mapbox-gl/dist/mapbox-gl.css');

		const mapBoxProvider = new MapboxProvider(mapboxgl.Map, mapboxgl.Marker, {
			accessToken: PUBLIC_MAP_BOX_API_KEY,
			container: mapElement,
			center: { lat: 51.505, lng: -0.09 },
			style: 'mapbox://styles/mapbox/streets-v11',
			zoom: 4
		});

		mapProvider = mapBoxProvider;

		mapbox = mapBoxProvider.getMap();
		mapbox.on('move', (e) => {
			zoom = mapbox.getZoom();
		});
		mapbox.on('click', (e) => {
			onMapClick();
		});
	}

	//#endregion

	//#region Google Maps

	import { GoogleMapsProvider, GoogleMapLightStyle, GoogleMapDarkStyle } from '$lib/google.js';

	import { Loader } from '@googlemaps/js-api-loader';
	import { getStates } from '$lib/map/manager/compute/states.js';
	import { testStates } from '$lib/map/manager/compute/test.js';

	import { PUBLIC_GOOGLE_MAPS_API_KEY } from '$env/static/public';

	let mapGoogle: google.maps.Map;
	let mapOverlayView: google.maps.OverlayView;

	let mapTypeLightId = 'light-id';
	let mapTypeDarkId = 'dark-id';

	async function loadGoogle() {
		const loader = new Loader({
			apiKey: PUBLIC_GOOGLE_MAPS_API_KEY,
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
				const bounds = maplibre.getBounds();
				return { sw: { lat: bounds._sw.lat, lng: bounds._sw.lng }, ne: { lat: bounds._ne.lat, lng: bounds._ne.lng } };
			}
			case 'mapbox': {
				const bounds = mapbox.getBounds();
				return {
					sw: { lat: bounds?.getSouthWest().lat ?? 0, lng: bounds?.getSouthWest().lng ?? 0 },
					ne: { lat: bounds?.getNorthEast().lat ?? 0, lng: bounds?.getNorthEast().lng ?? 0 }
				};
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

		let now = performance.now();
		await mapManager.updateMarkers(markers);
		console.log(`[UPDATE MARKERS ${markers.length}] ${performance.now() - now}ms`);

		const parameters = mapProvider.parameters;
		const input = markers.map((m) => ({
			id: m.id,
			rank: m.rank,
			lat: m.lat,
			lng: m.lng,
			width: m.tooltip.style.width,
			height: m.tooltip.style.height,
			margin: m.tooltip.style.margin
		}));

		now = performance.now();
		const states = getStates(parameters, input);
		console.log(`[STATES CALCULATION ${input.length}] ${performance.now() - now}ms`);

		now = performance.now();
		testStates(parameters, input, states);
		console.log(`[STATES TEST ${input.length}] ${performance.now() - now}ms`);
	}

	async function clearData() {
		mapMarkers.clear();
		mapManager.removeMarkers();
	}

	const zoomDelta = 0.05;

	function onZoomIn() {
		switch (mode) {
			case 'maplibre': {
				maplibre.setZoom(maplibre.getZoom() + zoomDelta);
				break;
			}
			case 'mapbox': {
				mapbox.setZoom(mapbox.getZoom() + zoomDelta);
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
				maplibre.setZoom(maplibre.getZoom() - zoomDelta);
				break;
			}
			case 'mapbox': {
				mapbox.setZoom(mapbox.getZoom() - zoomDelta);
				break;
			}
			case 'google': {
				mapGoogle.setZoom(mapGoogle.getZoom()! - zoomDelta);
				break;
			}
		}
	}

	function onMapClick() {
		mapManager.hidePopup();
	}

	//#region Data

	const total = 2000;
	const limit = 2000;

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
