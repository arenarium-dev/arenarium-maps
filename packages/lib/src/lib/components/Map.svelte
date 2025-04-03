<script lang="ts">
	import { onMount } from 'svelte';

	import { darkStyleSpecification, lightStyleSpecification } from '../core/styles.js';
	import { mapOptionsSchema, type MapOptions } from '../core/validation.js';

	import { MAP_BASE_SIZE, MAP_MAX_ZOOM, MAP_MIN_ZOOM } from '@workspace/shared/src/constants.js';

	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';

	let { options }: { options: MapOptions } = $props();

	//#region Map

	let map: maplibregl.Map;
	let mapContainer: HTMLElement;

	let mapWidth = $state<number>(0);
	let mapLoaded = $state<boolean>(false);

	onMount(() => {
		mapOptionsSchema.parse(options);

		loadMap();
		loadMapEvents();
	});

	function loadMap() {
		const position = options.position;

		map = new maplibregl.Map({
			style: getStyle(options.theme),
			center: { lat: position.center.lat, lng: position.center.lng },
			zoom: position.zoom,
			minZoom: getMapMinZoom(),
			maxZoom: MAP_MAX_ZOOM,
			container: mapContainer,
			pitchWithRotate: false,
			attributionControl: {
				compact: false
			}
		});
	}

	function loadMapEvents() {
		// Load event
		map.on('load', onMapLoaded);
		// Move event
		map.on('move', onMapMove);
		// Idle event
		map.on('idle', onMapIdle);
		// Click event
		map.on('click', onMapClick);
		// Disable map rotation using right click + drag
		map.dragRotate.disable();
		// Disable map rotation using keyboard
		map.keyboard.disable();
		// Disable map rotation using touch rotation gesture
		map.touchZoomRotate.disableRotation();
		// Disable map pitch using touch pitch gesture
		map.touchPitch.disable();
	}

	function onMapLoaded() {
		mapLoaded = true;
	}

	function onMapMove() {}

	function onMapIdle() {}

	function onMapClick(e: maplibregl.MapMouseEvent) {}

	function onWindowResize() {
		setMapMinZoom(getMapMinZoom());
	}

	function getMapMinZoom() {
		// Zoom =+ 1 doubles the width of the map
		// Min zoom has to have the whole map in window
		const mapWidthAtZoom0 = MAP_BASE_SIZE;
		const mapWidthMinZoom = Math.ceil(Math.log2(mapWidth / mapWidthAtZoom0));
		return Math.max(MAP_MIN_ZOOM, mapWidthMinZoom);
	}

	function setMapMinZoom(minZoom: number) {
		map?.setMinZoom(minZoom);
	}

	export function getCenter() {
		const center = map?.getCenter();
		if (!center) return;

		return { lat: center.lat, lng: center.lng };
	}

	export function getBounds() {
		const bounds = map?.getBounds();
		if (!bounds) return;

		return {
			sw: { lat: bounds.getSouthWest().lat, lng: bounds.getSouthWest().lng },
			ne: { lat: bounds.getNorthEast().lat, lng: bounds.getNorthEast().lng }
		};
	}

	export function getZoom() {
		return map?.getZoom() ?? options.position.zoom;
	}

	export function zoomIn() {
		map?.zoomIn();
	}

	export function zoomOut() {
		map?.zoomOut();
	}

	//#endregion

	//#region Zoom

	//#endregion

	//#region Themes

	let theme = $state<'light' | 'dark'>(options.theme);

	$effect(() => {
		if (mapLoaded) {
			map.setStyle(getStyle(theme), { diff: true });
		}
	});

	function getStyle(theme: 'light' | 'dark') {
		switch (theme) {
			case 'light':
				return lightStyleSpecification;
			case 'dark':
				return darkStyleSpecification;
		}
	}

	export function getTheme() {
		return $state.snapshot(theme);
	}

	export function setTheme(value: 'light' | 'dark') {
		theme = value;
		map.setStyle(getTheme());
	}

	//#endregion
</script>

<svelte:window onresize={onWindowResize} />

<div class="container {theme}">
	<div class="map" bind:this={mapContainer}></div>
</div>

<style lang="less">
	.light {
		--surface: rgb(252 248 248);
		--on-surface: rgb(28 27 27);
		--on-surface-variant: rgb(68 71 72);
	}

	.dark {
		--surface: rgb(20 19 19);
		--on-surface: rgb(229 226 225);
		--on-surface-variant: rgb(196 199 200);
	}

	.container {
		position: absolute;
		width: 100%;
		height: 100%;
		overflow: hidden;
		font-family: 'Roboto';
		box-sizing: border-box;
		touch-action: manipulation;

		.map {
			position: absolute;
			width: 100%;
			height: 100%;
			background-color: var(--surface-container);
			font-family: inherit;
			line-height: inherit;
		}

		:global {
			.maplibregl-map {
				font: inherit;
				z-index: 0;

				.maplibregl-ctrl-bottom-right {
					z-index: 10000;

					.maplibregl-ctrl-attrib {
						color: var(--on-surface-variant);
						background-color: var(--surface);
						opacity: 0.75;
						font-size: 10px;
						padding: 2px 5px;
						border-top-left-radius: 5px;

						.maplibregl-ctrl-attrib-inner {
							a {
								color: var(--on-surface);
							}
						}
					}
				}
			}
		}
	}
</style>
