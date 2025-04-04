<script lang="ts">
	import { onMount, tick } from 'svelte';

	import MapMarker from './marker/Marker.svelte';
	import MapMarkerCircle from './marker/Circle.svelte';

	import { darkStyleSpecification, lightStyleSpecification } from '../core/styles.js';
	import { mapOptionsSchema, type MapOptions, mapMarkersSchema } from '../core/validation.js';

	import {
		MAP_BASE_SIZE,
		MAP_DISPLAYED_ZOOM_DEPTH,
		MAP_MAX_ZOOM,
		MAP_MIN_ZOOM,
		MAP_VISIBLE_ZOOM_DEPTH
	} from '@workspace/shared/src/constants.js';
	import { type Types } from '@workspace/shared/src/types.js';

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

	//#region Markers

	interface MapMarkerData {
		marker: Types.Marker;
		libreMarker: maplibregl.Marker;
		content: string | undefined;
		element: HTMLElement | undefined;
		component: ReturnType<typeof MapMarker> | null;
		componentRendered: boolean;
		circle: ReturnType<typeof MapMarkerCircle> | null;
		circleRendered: boolean;
	}

	let mapMarkerIntervalId: number;
	let mapMarkerData = $state(new Array<MapMarkerData>());

	onMount(() => {
		mapMarkerIntervalId = window.setInterval(processMarkers, 25);
		return () => clearInterval(mapMarkerIntervalId);
	});

	function processMarkers() {
		if (!mapLoaded || mapMarkerData.length == 0) return;

		const mapZoom = map.getZoom();
		if (!mapZoom) return;

		processMarkersMap(mapZoom);
		processMarkersComponents(mapZoom);
		processMarkersState(mapZoom);
	}

	function processMarkersMap(mapZoom: number) {
		type BoundsPair = [maplibregl.LngLatBounds, maplibregl.LngLatBounds];

		const getBounds = (swLng: number, swLat: number, neLng: number, neLat: number) => {
			return new maplibregl.LngLatBounds([swLng, swLat], [neLng, neLat]);
		};

		const getBoundsPairs = (swX: number, swY: number, neX: number, neY: number): BoundsPair => {
			const sw = map.unproject([swX, swY]);
			const ne = map.unproject([neX, neY]);

			if (sw.lng < -180) {
				const boundsLeft = getBounds(-180, sw.lat, ne.lng, ne.lat);
				const boundsRight = getBounds(sw.wrap().lng, sw.lat, 180, ne.lat);
				return [boundsLeft, boundsRight];
			}

			if (ne.lng > 180) {
				const boundsLeft = getBounds(sw.lng, sw.lat, 180, ne.lat);
				const boundsRight = getBounds(-180, sw.lat, ne.wrap().lng, ne.lat);
				return [boundsLeft, boundsRight];
			}

			const boundsAll = getBounds(sw.lng, sw.lat, ne.lng, ne.lat);
			const boundsNone = getBounds(0, 0, 0, 0);
			return [boundsAll, boundsNone];
		};

		const doesBoundsPairContain = ([bounds1, bounds2]: BoundsPair, lat: number, lng: number) => {
			return bounds1.contains([lng, lat]) || bounds2.contains([lng, lat]);
		};

		const setMap = (marker: maplibregl.Marker, map: maplibregl.Map | null) => {
			if (marker._map != map) {
				if (map == null) marker.remove();
				else marker.addTo(map);
			}
		};

		// Get bounds pairs
		const offset = MAP_BASE_SIZE;
		const offsetBounds = getBoundsPairs(-offset, window.innerHeight + offset, window.innerWidth + offset, -offset);
		const windowBounds = getBoundsPairs(0, window.innerHeight, window.innerWidth, 0);

		// Process markers
		for (let i = 0; i < mapMarkerData.length; i++) {
			const data = mapMarkerData[i];
			const marker = data.marker;
			const libreMarker = data.libreMarker;

			// Expanded markers (offset bounds)
			if (marker.zet <= mapZoom) {
				if (doesBoundsPairContain(offsetBounds, marker.lat, marker.lng)) {
					setMap(libreMarker, map);
					continue;
				}
			}

			// Visible markers (window bounds)
			if (marker.zet <= mapZoom + MAP_VISIBLE_ZOOM_DEPTH) {
				if (doesBoundsPairContain(windowBounds, marker.lat, marker.lng)) {
					setMap(libreMarker, map);
					continue;
				}
			}

			// Clear map for rest of markers
			setMap(libreMarker, null);
		}
	}

	function processMarkersComponents(mapZoom: number) {
		for (let i = 0; i < mapMarkerData.length; i++) {
			const data = mapMarkerData[i];
			const libreMarker = data.libreMarker;
			if (!libreMarker._map) continue;

			if (!data.circleRendered) {
				data.circleRendered = true;
			}

			if (!data.componentRendered && data.marker.zet <= mapZoom + MAP_DISPLAYED_ZOOM_DEPTH) {
				data.componentRendered = true;
			}
		}
	}

	function processMarkersState(mapZoom: number) {
		for (let i = 0; i < mapMarkerData.length; i++) {
			const data = mapMarkerData[i];
			const libreMarker = data.libreMarker;
			if (!libreMarker._map) continue;

			const marker = data.marker;
			const component = data.component;
			const circle = data.circle;

			// Set marker display status
			if (marker.zet <= mapZoom + MAP_DISPLAYED_ZOOM_DEPTH) {
				component?.setDisplayed(true);
			} else {
				component?.setDisplayed(false);
			}

			// Set marker collapse status angle
			// or set circle distance
			if (marker.zet <= mapZoom && component != null) {
				circle?.setCollapsed(true);

				component?.setCollapsed(false);
				component?.setAngle(marker.angs.findLast((a) => a[0] <= mapZoom)?.[1]!);
			} else {
				component?.setCollapsed(true);

				circle?.setCollapsed(false);
				circle?.setDistance((marker.zet - mapZoom) / MAP_VISIBLE_ZOOM_DEPTH);
			}
		}
	}

	export async function addMarkers(markers: MapMarker[], markerContentCallback: (ids: string[]) => Promise<string[]>) {
		const markerSchemaResult = await mapMarkersSchema.safeParseAsync(markers);
		if (!markerSchemaResult.success) throw new Error('Invalid markers');

		// Clear data
		for (let i = 0; i < mapMarkerData.length; i++) {
			const data = mapMarkerData[i];
			data.libreMarker?.remove();
		}
		mapMarkerData.length = 0;

		const markersNew = markers.toSorted((p1, p2) => p1.zet - p2.zet).slice(0, MAP_MARKERS_MAX_COUNT);

		for (let i = 0; i < MAP_MARKERS_MAX_COUNT; i++) {
			if (i < markersNew.length) {
				const marker = markersNew[i];
				mapMarkers[i] = marker;
				mapLibreMarkers[i]?.remove();
			}

			mapMarkerContent[i] = undefined;
			mapMarkerComponentsRendered[i] = false;
			mapCircleComponentsRendered[i] = false;
		}

		await tick();

		for (let i = 0; i < markersNew.length; i++) {
			const marker = markersNew[i];

			const mapLibreMarker = new maplibregl.Marker({ element: mapMarkerElements[i] });
			mapLibreMarker.setLngLat([marker.lng, marker.lat]);

			mapLibreMarkers[i] = mapLibreMarker;
		}

		mapMarkerCount = markersNew.length;
	}

	async function getVisibleBlocks(blocks: Types.Block[], bounds: App.Map.Bounds, zoom: number) {
	return blocks.filter((block) => {
		if (zoom + MAP_DISPLAYED_ZOOM_DEPTH < block.zs) return false;
		if (block.ne.lng < bounds.sw.lng || bounds.ne.lng < block.sw.lng) return false;
		if (block.ne.lat < bounds.sw.lat || bounds.ne.lat < block.sw.lat) return false;
		return true;
	});
}
	//#endregion
</script>

<svelte:window onresize={onWindowResize} />

<div class="container {theme}">
	<div class="map" bind:this={mapContainer}></div>
	<div class="markers">
		{#each mapMarkerData as data, i}
			<div class="marker" style="z-index: {mapMarkerData.length - i};" bind:this={data.element}>
				{#if data.circleRendered}
					<MapMarkerCircle bind:this={data.circle} />
				{/if}
				{#if data.componentRendered && data.content}
					<MapMarker bind:this={data.component}>
						{@html data.content}
					</MapMarker>
				{/if}
			</div>
		{/each}
	</div>
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
