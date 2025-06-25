<script lang="ts">
	import { onMount } from 'svelte';

	import { MapManager, type MapMarker } from '@arenarium/maps';
	import { MapLibreProvider, MapLibreLightStyle } from '@arenarium/maps/maplibre';
	import '@arenarium/maps/dist/style.css';

	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';

	let mapManager: MapManager;
	let map: maplibregl.Map;
	let mapContainer: HTMLDivElement;

	onMount(() => {
		const mapProvider = new MapLibreProvider(maplibregl.Map, maplibregl.Marker, {
			container: mapContainer,
			style: MapLibreLightStyle,
			center: { lat: 51.505, lng: -0.09 },
			zoom: 13
		});

		mapManager = new MapManager('5b2a06ecfa734dccaa0e7488aaceb487', mapProvider);
		// mapManager.setColors('violet', 'white', 'black');

		map = mapProvider.getMap();
	});

	async function insert() {
		const bounds = map.getBounds();
		const markers = getMarkers(bounds);

		const now = performance.now();
		await mapManager.updateMarkers(markers);
		console.log(`[SET ${markers.length}] ${performance.now() - now}ms`);
	}

	function remove() {
		mapManager.removeMarkers();
	}

	function getMarkers(bounds: maplibregl.LngLatBounds): MapMarker[] {
		const markers = new Array<MapMarker>();

		const centers = [
			{ lat: 51.505, lng: -0.09 },
			{ lat: 45, lng: 22 },
			{ lat: 52.52, lng: 13.409 },
			{ lat: 48.8566, lng: 2.3522 }
		];
		const radius = 10;
		const count = 1024;
		const limit = 256;

		let randomPrev = 1;
		const random = () => {
			const val = (randomPrev * 16807) % 2147483647;
			randomPrev = val;
			return val / 2147483647;
		};

		let cnt = 0;

		for (let i = 0; i < count; i++) {
			const index = Math.floor(random() * count);
			const distance = radius / (count - index);
			const center = centers[index % centers.length];

			const lat = center.lat + distance * (-1 + random() * 2);
			const lng = center.lng + distance * (-1 + random() * 2);
			if (lat < bounds._sw.lat || bounds._ne.lat < lat || lng < bounds._sw.lng || bounds._ne.lng < lng) continue;
			if (cnt++ > limit) break;

			markers.push({
				id: i.toString(),
				rank: i,
				lat: lat,
				lng: lng,
				tooltip: {
					style: {
						height: 100,
						width: 150,
						margin: 8,
						radius: 12
					},
					body: getTooltipBody
				}
			});
		}

		return markers;
	}

	async function getTooltipBody(id: string): Promise<HTMLElement> {
		return await new Promise((resolve) => {
			const element = document.createElement('div');
			element.style.width = '150px';
			element.style.height = '100px';
			element.style.color = 'red';
			element.style.padding = '8px';
			element.innerText = id;
			resolve(element);
		});
	}
</script>

<div class="map" bind:this={mapContainer}></div>

<div class="bottom-left">
	<button class="button" onclick={insert}> Insert </button>
	<button class="button" onclick={remove}> Remove </button>
</div>

<style>
	.map {
		position: absolute;
		top: 0px;
		left: 0px;
		width: 100%;
		height: 100%;
		background-color: gray;
	}

	.bottom-left {
		position: fixed;
		bottom: 20px;
		left: 20px;
	}
</style>
