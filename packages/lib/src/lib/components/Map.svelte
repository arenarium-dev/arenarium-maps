<script lang="ts">
	import { onMount } from 'svelte';

	import Icon from './utils/Icon.svelte';

	import { darkStyleSpecification, lightStyleSpecification } from '../core/styles.js';
	import { mapOptionsSchema, type MapOptions } from '../core/validation.js';
	import { MAP_BASE_SIZE, MAP_MAX_ZOOM, MAP_MIN_ZOOM } from '../core/constants.js';

	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';

	let { options }: { options: MapOptions } = $props();

	//#region Map

	let map: maplibregl.Map;
	let mapContainer: HTMLElement;
	let mapLoaded = $state<boolean>(false);

	onMount(() => {
		mapOptionsSchema.parse(options);

		loadMap();
		loadMapEvents();
	});

	function loadMap() {
		const position = options.position;

		map = new maplibregl.Map({
			style: getMapStyle(options.theme),
			center: { lat: position.center.lat, lng: position.center.lng },
			zoom: position.zoom,
			minZoom: getMapMinZoom(window.innerWidth),
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
		setMapMinZoom(getMapMinZoom(window.innerWidth));
	}

	function getMapPosition() {
		const center = map.getCenter();
		const zoom = map.getZoom();
		return { lat: center.lat, lng: center.lng, zoom: zoom };
	}

	function getMapBounds() {
		const bounds = map.getBounds();
		return {
			sw: { lat: bounds.getSouthWest().lat, lng: bounds.getSouthWest().lng },
			ne: { lat: bounds.getNorthEast().lat, lng: bounds.getNorthEast().lng }
		};
	}

	function getMapMinZoom(mapWidth: number) {
		// Zoom =+ 1 doubles the width of the map
		// Min zoom has to have the whole map in window
		const mapWidthAtZoom0 = MAP_BASE_SIZE;
		const mapWidthMinZoom = Math.ceil(Math.log2(mapWidth / mapWidthAtZoom0));
		return Math.max(MAP_MIN_ZOOM, mapWidthMinZoom);
	}

	function setMapMinZoom(minZoom: number) {
		map?.setMinZoom(minZoom);
	}

	//#endregion

	//#region Zoom

	function onZoomIn() {
		map?.zoomIn();
	}

	function onZoomOut() {
		map?.zoomOut();
	}

	//#endregion

	//#region Themes

	$effect(() => {
		if (mapLoaded) {
			map.setStyle(getMapStyle(options.theme));
		}
	});

	function getMapStyle(theme: 'light' | 'dark') {
		switch (theme) {
			case 'light':
				return lightStyleSpecification;
			case 'dark':
				return darkStyleSpecification;
		}
	}

	export function setMapStyle(theme: 'light' | 'dark') {
		options.theme = theme;
		map.setStyle(getMapStyle(theme));
	}

	//#endregion
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" />
	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700;900&display=swap" />
	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded" />
</svelte:head>

<svelte:window onresize={onWindowResize} />

<div class="container {options.theme}">
	<div class="map" bind:this={mapContainer}></div>
	<div class="zooms">
		<button class="button shadow-small" onmousedown={onZoomIn}>
			<Icon name={'add'} />
		</button>
		<button class="button shadow-small" onmousedown={onZoomOut}>
			<Icon name={'remove'} />
		</button>
	</div>
</div>

<style>
	.light {
		--primary: rgb(93 95 95);
		--surface-tint: rgb(93 95 95);
		--on-primary: rgb(255 255 255);
		--primary-container: rgb(255 255 255);
		--on-primary-container: rgb(116 118 118);
		--secondary: rgb(94 94 94);
		--on-secondary: rgb(255 255 255);
		--secondary-container: rgb(228 226 226);
		--on-secondary-container: rgb(100 100 100);
		--tertiary: rgb(93 95 95);
		--on-tertiary: rgb(255 255 255);
		--tertiary-container: rgb(255 255 255);
		--on-tertiary-container: rgb(116 118 118);
		--error: rgb(186 26 26);
		--on-error: rgb(255 255 255);
		--error-container: rgb(255 218 214);
		--on-error-container: rgb(147 0 10);
		--background: rgb(252 248 248);
		--on-background: rgb(28 27 27);
		--surface: rgb(252 248 248);
		--on-surface: rgb(28 27 27);
		--surface-variant: rgb(224 227 227);
		--on-surface-variant: rgb(68 71 72);
		--outline: rgb(116 120 120);
		--outline-variant: rgb(196 199 200);
		--shadow: rgb(0 0 0);
		--scrim: rgb(0 0 0);
		--inverse-surface: rgb(49 48 48);
		--inverse-on-surface: rgb(244 240 239);
		--inverse-primary: rgb(198 198 199);
		--primary-fixed: rgb(226 226 226);
		--on-primary-fixed: rgb(26 28 28);
		--primary-fixed-dim: rgb(198 198 199);
		--on-primary-fixed-variant: rgb(69 71 71);
		--secondary-fixed: rgb(228 226 226);
		--on-secondary-fixed: rgb(27 28 28);
		--secondary-fixed-dim: rgb(200 198 198);
		--on-secondary-fixed-variant: rgb(71 71 71);
		--tertiary-fixed: rgb(226 226 226);
		--on-tertiary-fixed: rgb(26 28 28);
		--tertiary-fixed-dim: rgb(198 198 199);
		--on-tertiary-fixed-variant: rgb(69 71 71);
		--surface-dim: rgb(221 217 217);
		--surface-bright: rgb(252 248 248);
		--surface-container-lowest: rgb(255 255 255);
		--surface-container-low: rgb(246 243 242);
		--surface-container: rgb(241 237 236);
		--surface-container-high: rgb(235 231 231);
		--surface-container-highest: rgb(229 226 225);

		--border: color-mix(in srgb, var(--outline-variant) 50%, var(--surface) 50%);
		--hover: color-mix(in srgb, var(--surface-container-high) 50%, transparent 50%);
	}

	.dark {
		--primary: rgb(255 255 255);
		--surface-tint: rgb(198 198 199);
		--on-primary: rgb(47 49 49);
		--primary-container: rgb(226 226 226);
		--on-primary-container: rgb(99 101 101);
		--secondary: rgb(200 198 198);
		--on-secondary: rgb(48 48 48);
		--secondary-container: rgb(73 73 73);
		--on-secondary-container: rgb(185 184 184);
		--tertiary: rgb(255 255 255);
		--on-tertiary: rgb(47 49 49);
		--tertiary-container: rgb(226 226 226);
		--on-tertiary-container: rgb(99 101 101);
		--error: rgb(255 180 171);
		--on-error: rgb(105 0 5);
		--error-container: rgb(147 0 10);
		--on-error-container: rgb(255 218 214);
		--background: rgb(20 19 19);
		--on-background: rgb(229 226 225);
		--surface: rgb(20 19 19);
		--on-surface: rgb(229 226 225);
		--surface-variant: rgb(68 71 72);
		--on-surface-variant: rgb(196 199 200);
		--outline: rgb(142 145 146);
		--outline-variant: rgb(68 71 72);
		--shadow: rgb(0 0 0);
		--scrim: rgb(0 0 0);
		--inverse-surface: rgb(229 226 225);
		--inverse-on-surface: rgb(49 48 48);
		--inverse-primary: rgb(93 95 95);
		--primary-fixed: rgb(226 226 226);
		--on-primary-fixed: rgb(26 28 28);
		--primary-fixed-dim: rgb(198 198 199);
		--on-primary-fixed-variant: rgb(69 71 71);
		--secondary-fixed: rgb(228 226 226);
		--on-secondary-fixed: rgb(27 28 28);
		--secondary-fixed-dim: rgb(200 198 198);
		--on-secondary-fixed-variant: rgb(71 71 71);
		--tertiary-fixed: rgb(226 226 226);
		--on-tertiary-fixed: rgb(26 28 28);
		--tertiary-fixed-dim: rgb(198 198 199);
		--on-tertiary-fixed-variant: rgb(69 71 71);
		--surface-dim: rgb(20 19 19);
		--surface-bright: rgb(58 57 57);
		--surface-container-lowest: rgb(14 14 14);
		--surface-container-low: rgb(28 27 27);
		--surface-container: rgb(32 31 31);
		--surface-container-high: rgb(42 42 42);
		--surface-container-highest: rgb(53 52 52);

		--border: var(--surface-container);
		--hover: color-mix(in srgb, var(--surface-container-low) 50%, transparent 50%);
	}

	:root {
		/* Derived */
		--on-surface-dim: color(from var(--on-surface) srgb r g b / 0.85);
		--on-surface-dimmest: color(from var(--on-surface) srgb r g b / 0.7);
		--outline-variant-dim: color-mix(in srgb, var(--outline-variant) 50%, transparent 50%);

		font-family:
			'Roboto',
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			'Helvetica Neue',
			Arial,
			sans-serif,
			'Apple Color Emoji',
			'Segoe UI Emoji',
			'Segoe UI Symbol';
		box-sizing: border-box;
		touch-action: manipulation;
	}

	.shadow-small {
		box-shadow:
			0 0 4px 2px rgb(from var(--shadow) r g b / 0.2),
			0 3px 6px rgb(from var(--shadow) r g b / 0.3);
	}

	.shadow-medium {
		box-shadow:
			0 10px 20px 3px rgb(from var(--shadow) r g b / 0.2),
			0 6px 10px rgb(from var(--shadow) r g b / 0.3);
	}

	.shadow-large {
		box-shadow:
			0 19px 38px 6px rgb(from var(--shadow) r g b / 0.2),
			0 10px 16px rgb(from var(--shadow) r g b / 0.3);
	}

	.container {
		position: absolute;
		width: 100%;
		height: 100%;
		overflow: hidden;

		.map {
			position: absolute;
			width: 100%;
			height: 100%;
			background-color: var(--surface-container);
			font-family: inherit;
			line-height: inherit;
		}

		.zooms {
			position: absolute;
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
				color: var(--on-surface);
				background-color: var(--surface);
				transition: all ease-in-out 125ms;
				outline: none;
				border: none;
				cursor: pointer;

				&:hover {
					background-color: var(--surface-container);
				}
			}
		}

		:global {
			.maplibregl-map {
				font: inherit;
				z-index: 0;

				.maplibregl-ctrl-bottom-right {
					z-index: 10000;

					.maplibregl-ctrl-attrib {
						color: var(--on-surface);
						background-color: var(--surface);
						opacity: 0.75;
						font-size: 10px;
						padding: 2px 5px;
						border-top-left-radius: 5px;

						.maplibregl-ctrl-attrib-inner {
							a {
								color: var(--primary);
							}
						}
					}
				}
			}

			@media (display-mode: standalone) {
				.maplibregl-map {
					.maplibregl-ctrl-bottom-right {
						display: none;
					}
				}
			}
		}
	}
</style>
