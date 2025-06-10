<script lang="ts">
	import { MapManager } from '../map/manager.js';

	import { MAP_BASE_SIZE, MAP_MAX_ZOOM, MAP_MIN_ZOOM } from '@workspace/shared/src/constants.js';

	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';

	let { options }: { options: maplibregl.MapOptions } = $props();

	let mapMinZoom = options?.minZoom ?? MAP_MIN_ZOOM;
	let mapMaxZoom = options?.maxZoom ?? MAP_MAX_ZOOM;

	let mapWidth = $state<number>(0);
	let mapHeight = $state<number>(0);

	let maplibre = new maplibregl.Map({
		...options,
		container: 'map',
		minZoom: getViewportMinZoom(mapMinZoom),
		maxZoom: mapMaxZoom,
		pitchWithRotate: false,
		attributionControl: { customAttribution: '@arenarium/maps' }
	});
	// Disable map rotation using right click + drag
	maplibre.dragRotate.disable();
	// Disable map rotation using keyboard
	maplibre.keyboard.disable();
	// Disable map rotation using touch rotation gesture
	maplibre.touchZoomRotate.disableRotation();
	// Disable map pitch using touch pitch gesture
	maplibre.touchPitch.disable();

	let mapPopupManager = new MapManager(maplibre, (o) => new maplibregl.Marker(o));

	function getViewportMinZoom(minZoom: number) {
		// Zoom =+ 1 doubles the width of the map
		// Min zoom has to have the whole map in window
		const mapWidthAtZoom0 = MAP_BASE_SIZE;
		const mapWidthMinZoom = Math.ceil(Math.log2(mapWidth / mapWidthAtZoom0));
		return Math.max(minZoom, mapWidthMinZoom);
	}

	export const map = () => maplibre;
	export const manager = () => mapPopupManager;
</script>

<svelte:window onresize={() => maplibre.setMinZoom(getViewportMinZoom(mapMinZoom))} />

<div id="map" bind:clientWidth={mapWidth} bind:clientHeight={mapHeight}></div>

<style lang="less">
	#map {
		position: absolute;
		width: 100%;
		height: 100%;
		font-family: inherit;
		line-height: inherit;
		box-sizing: border-box;
		touch-action: manipulation;
		overflow: hidden;
	}
</style>
