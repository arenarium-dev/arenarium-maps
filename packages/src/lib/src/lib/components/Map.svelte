<script lang="ts">
	import { onMount } from 'svelte';

	import { MapPopupManager } from '../manager.js';

	import { MAP_BASE_SIZE, MAP_MAX_ZOOM, MAP_MIN_ZOOM } from '@workspace/shared/src/constants.js';

	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';

	let { options }: { options: maplibregl.MapOptions } = $props();

	let map: maplibregl.Map;
	let mapContainer: HTMLElement;
	let mapPopupManager: MapPopupManager;

	let mapMinZoom: number;
	let mapMaxZoom: number;

	let mapWidth = $state<number>(0);
	let mapHeight = $state<number>(0);

	onMount(() => {
		mapMinZoom = options?.minZoom ?? MAP_MIN_ZOOM;
		mapMaxZoom = options?.maxZoom ?? MAP_MAX_ZOOM;

		map = new maplibregl.Map({
			...options,
			minZoom: getViewportMinZoom(mapMinZoom),
			maxZoom: mapMaxZoom,
			container: mapContainer,
			pitchWithRotate: false,
			attributionControl: { compact: false }
		});

		// Disable map rotation using right click + drag
		map.dragRotate.disable();
		// Disable map rotation using keyboard
		map.keyboard.disable();
		// Disable map rotation using touch rotation gesture
		map.touchZoomRotate.disableRotation();
		// Disable map pitch using touch pitch gesture
		map.touchPitch.disable();

		mapPopupManager = new MapPopupManager(map, (o) => new maplibregl.Marker(o));
	});

	function getViewportMinZoom(minZoom: number) {
		// Zoom =+ 1 doubles the width of the map
		// Min zoom has to have the whole map in window
		const mapWidthAtZoom0 = MAP_BASE_SIZE;
		const mapWidthMinZoom = Math.ceil(Math.log2(mapWidth / mapWidthAtZoom0));
		return Math.max(minZoom, mapWidthMinZoom);
	}

	export const maplibre = () => map;

	export const manager = () => mapPopupManager;
</script>

<svelte:window onresize={() => map.setMinZoom(getViewportMinZoom(mapMinZoom))} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="container">
	<div class="map" bind:this={mapContainer} bind:clientWidth={mapWidth} bind:clientHeight={mapHeight}></div>
	<div class="logo">
		<a href="https://arenarium.dev" target="_blank">
			<span class="text"> @arenarium/maps </span>
		</a>
	</div>
</div>

<style lang="less">
	.container {
		position: absolute;
		width: 100%;
		height: 100%;
		box-sizing: border-box;
		touch-action: manipulation;
		overflow: hidden;

		.map {
			position: absolute;
			width: 100%;
			height: 100%;
			font-family: inherit;
			line-height: inherit;
		}

		.logo {
			position: absolute;
			bottom: 0px;
			left: 0px;

			background-color: color-mix(in srgb, var(--map-style-background) 50%, transparent 50%);
			color: var(--map-style-text);
			font-size: 10px;
			padding: 2px 5px;
			border-top-right-radius: 5px;
			box-shadow: 1px -1px 2px rgba(0, 0, 0, 0.2);

			a {
				display: flex;
				align-items: center;
				gap: 3px;
				color: var(--map-style-text);
				text-decoration: none;
				font-weight: 600;
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
	}

	@media (max-width: 512px) {
		.container {
			.logo {
				top: 0px;
				right: 0px;
				bottom: auto;
				left: auto;
				border-top-right-radius: 0px;
				border-bottom-left-radius: 5px;
			}
		}
	}
</style>
