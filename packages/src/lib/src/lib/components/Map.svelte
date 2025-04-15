<script lang="ts">
	import { onMount, tick } from 'svelte';

	import MapMarker from './marker/Marker.svelte';
	import MapMarkerCircle from './marker/Circle.svelte';

	import { BlockData, getBlocks } from '../map/data/blocks.svelte.js';
	import { MarkerData, BoundsPair } from '../map/data/markers.svelte.js';
	import { darkStyleSpecification, lightStyleSpecification } from '../map/styles.js';
	import { mapOptionsSchema, type MapOptions, mapPopupsSchema, type MapTheme } from '../map/input.js';
	import { type MapComponent } from '../map/types.js';

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

	function onMapMove() {
		if (options.events?.onMapMove) {
			const center = map.getCenter();
			const zoom = map.getZoom();
			options.events.onMapMove({ lat: center.lat, lng: center.lng, zoom: zoom });
		}
	}

	function onMapIdle() {
		options.events?.onMapIdle?.call(null);
	}

	function onMapClick(e: maplibregl.MapMouseEvent) {
		options.events?.onMapClick?.call(null);
	}

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

	export function setCenter(lat: number, lng: number) {
		map?.setCenter({ lat, lng });
	}

	export function getZoom() {
		return map?.getZoom() ?? options.position.zoom;
	}

	export function setZoom(zoom: number) {
		map?.setZoom(zoom);
	}

	export function getBounds() {
		const bounds = map?.getBounds();
		if (!bounds) return;

		return {
			sw: { lat: bounds.getSouthWest().lat, lng: bounds.getSouthWest().lng },
			ne: { lat: bounds.getNorthEast().lat, lng: bounds.getNorthEast().lng }
		};
	}

	export function zoomIn() {
		map?.zoomIn();
	}

	export function zoomOut() {
		map?.zoomOut();
	}

	//#endregion

	//#region Themes

	let theme = $state<MapTheme>(options.theme);

	$effect(() => {
		if (mapLoaded) {
			map.setStyle(getStyle(theme), { diff: true });
		}
	});

	function getStyle(theme: MapTheme) {
		if (theme.url) return theme.url;

		switch (theme.name) {
			case 'light':
				return lightStyleSpecification;
			case 'dark':
				return darkStyleSpecification;
		}
	}

	export function getTheme() {
		return $state.snapshot(theme);
	}

	export function setTheme(value: MapTheme) {
		theme = value;
		map.setStyle(getStyle(theme), { diff: true });
	}

	//#endregion

	//#region Data

	let mapPopupContentCallback: MapComponent.PopupContentCallback | undefined = undefined;

	let mapBlockIntervalId: number;
	let mapMarkerIntervalId: number;

	let mapBlockData = $state(new Array<BlockData>());
	let mapMarkerData = $state(new Array<MarkerData>());

	onMount(() => {
		const blocksLoop = async () => {
			await processBlocks();
			mapBlockIntervalId = window.setTimeout(blocksLoop, 50);
		};

		const markersLoop = () => {
			processMarkers();
			mapMarkerIntervalId = window.setTimeout(markersLoop, 25);
		};

		blocksLoop();
		markersLoop();

		return () => {
			clearInterval(mapBlockIntervalId);
			clearInterval(mapMarkerIntervalId);
		};
	});

	async function processBlocks() {
		// Check if callback is set
		if (!mapPopupContentCallback) return;
		// Check if map is loaded or block data is empty
		if (!mapLoaded || mapBlockData.length == 0) return;

		// Get map bounds
		const bounds = getBounds();
		const zoom = getZoom();
		if (!bounds) return;

		// Get non loaded blocks
		const nonLoadedBlockData = mapBlockData.filter((data) => !data.loaded);
		if (nonLoadedBlockData.length == 0) return;

		const nonLoadedVisibleBlockData = nonLoadedBlockData.filter((data) => {
			const block = data.block;
			if (zoom + MAP_DISPLAYED_ZOOM_DEPTH < block.zs) return false;
			if (block.ne.lng < bounds.sw.lng || bounds.ne.lng < block.sw.lng) return false;
			if (block.ne.lat < bounds.sw.lat || bounds.ne.lat < block.sw.lat) return false;
			return true;
		});
		if (nonLoadedVisibleBlockData.length == 0) return;

		try {
			// Get marker content with callback
			const markerIds = nonLoadedVisibleBlockData.flatMap((d) => d.block.markers).map((m) => m.id);
			const markersPopupContent = await mapPopupContentCallback(markerIds);

			// Set marker content to marker data
			const markerDataMap = new Map<string, MarkerData>();
			for (let i = 0; i < mapMarkerData.length; i++) {
				const data = mapMarkerData[i];
				markerDataMap.set(data.marker.id, data);
			}

			for (let i = 0; i < markerIds.length; i++) {
				const id = markerIds[i];
				const content = markersPopupContent[i];

				const markerData = markerDataMap.get(id);
				if (!markerData) throw new Error('Failed to find marker data.');
				markerData.content = content;
			}

			// Set block loaded to true
			nonLoadedVisibleBlockData.forEach((b) => (b.loaded = true));
		} catch (e) {
			console.error(e);

			// If error, set block loaded to false
			nonLoadedVisibleBlockData.forEach((b) => (b.loaded = false));
		}
	}

	function processMarkers() {
		// Check if map is loaded or marker data is empty
		if (!mapLoaded || mapMarkerData.length == 0) return;

		// Get map zoom
		const zoom = map.getZoom();
		if (!zoom) return;

		// Get markers on map
		const markerDataOnMap = new Array<MarkerData>();

		const offset = MAP_BASE_SIZE;
		const offsetBounds = new BoundsPair(map, -offset, window.innerHeight + offset, window.innerWidth + offset, -offset);
		const windowBounds = new BoundsPair(map, 0, window.innerHeight, window.innerWidth, 0);

		for (let i = 0; i < mapMarkerData.length; i++) {
			const data = mapMarkerData[i];
			const marker = data.marker;
			const libreMarker = data.libreMarker;
			if (!libreMarker) continue;

			// Expanded markers (offset bounds)
			if (marker.zet <= zoom) {
				if (offsetBounds.contains(marker.lat, marker.lng)) {
					if (libreMarker._map != map) libreMarker.addTo(map);
					markerDataOnMap.push(data);
					continue;
				}
			}

			// Visible markers (window bounds)
			if (marker.zet <= zoom + MAP_VISIBLE_ZOOM_DEPTH) {
				if (windowBounds.contains(marker.lat, marker.lng)) {
					if (libreMarker._map != map) libreMarker.addTo(map);
					markerDataOnMap.push(data);
					continue;
				}
			}

			// Clear map for rest of markers
			if (libreMarker._map != null) libreMarker.remove();
		}

		// Process markers on map
		for (let i = 0; i < markerDataOnMap.length; i++) {
			const data = markerDataOnMap[i];
			const marker = data.marker;
			const component = data.component;
			const circle = data.circle;

			// Set circle rendered to true if not set
			if (!data.circleRendered) {
				data.circleRendered = true;
			}

			// Set component rendered to true if not set and marker is in displayed depth
			if (!data.componentRendered && data.marker.zet <= zoom + MAP_DISPLAYED_ZOOM_DEPTH) {
				data.componentRendered = true;
			}

			// Set marker display status
			if (marker.zet <= zoom + MAP_DISPLAYED_ZOOM_DEPTH) {
				component?.setDisplayed(true);
			} else {
				component?.setDisplayed(false);
			}

			// Set marker collapse status angle
			// or set circle distance
			if (marker.zet <= zoom && component != null) {
				circle?.setCollapsed(true);

				component?.setCollapsed(false);
				component?.setAngle(marker.angs.findLast((a) => a[0] <= zoom)?.[1]!);
			} else {
				component?.setCollapsed(true);

				circle?.setCollapsed(false);
				circle?.setDistance((marker.zet - zoom) / MAP_VISIBLE_ZOOM_DEPTH);
			}
		}
	}

	function onPopupClick(id: string) {
		options.events?.onPopupClick?.call(null, id);
	}

	export async function setPopupsContentCallback(callback: MapComponent.PopupContentCallback) {
		mapPopupContentCallback = callback;
	}

	export async function setPopups(popups: Types.Popup[]) {
		try {
			options.events?.onLoadingStart?.call(null);

			// Validate popups
			const popupsSchemaResult = await mapPopupsSchema.safeParseAsync(popups);
			if (!popupsSchemaResult.success) throw new Error('Invalid markers input');

			// Clear data
			for (let i = 0; i < mapMarkerData.length; i++) {
				const data = mapMarkerData[i];
				data.libreMarker?.remove();
			}
			mapMarkerData.length = 0;

			// Get data
			const blocks = await getBlocks(popups);
			const blockMarkers = blocks.flatMap((b) => b.markers).toSorted((p1, p2) => p1.zet - p2.zet);

			// Set data
			mapBlockData = blocks.map((b) => new BlockData(b));
			mapMarkerData = blockMarkers.map((m) => new MarkerData(m));

			// Add libre markers
			await tick();

			for (let i = 0; i < mapMarkerData.length; i++) {
				const data = mapMarkerData[i];
				const marker = data.marker;
				const element = data.element;
				if (!element) throw new Error('Failed to render marker element.');

				const mapLibreMarker = new maplibregl.Marker({ element });
				mapLibreMarker.setLngLat([marker.lng, marker.lat]);

				data.libreMarker = mapLibreMarker;
			}
		} finally {
			options.events?.onLoadingEnd?.call(null);
		}
	}

	//#endregion
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" />
	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@1,100..900&display=swap" />
</svelte:head>

<svelte:window onresize={onWindowResize} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="container"
	style="--primary: {theme.colors.primary}; --background: {theme.colors.background}; --text: {theme.colors.text};"
>
	<div class="map" bind:this={mapContainer}></div>
	<div class="markers">
		{#each mapMarkerData as data, i}
			<div class="marker" style="z-index: {mapMarkerData.length - i};" bind:this={data.element}>
				{#if data.circleRendered}
					<MapMarkerCircle bind:this={data.circle} />
				{/if}
				{#if data.componentRendered && data.content}
					<MapMarker bind:this={data.component}>
						<div
							class="popup"
							style="width: {data.marker.width}px; height: {data.marker.height}px;"
							onclick={() => onPopupClick(data.marker.id)}
						>
							{@html data.content}
						</div>
					</MapMarker>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style lang="less">
	.container {
		position: absolute;
		width: 100%;
		height: 100%;
		overflow: hidden;
		font-family: 'Noto Sans';
		box-sizing: border-box;
		touch-action: manipulation;

		.map {
			position: absolute;
			width: 100%;
			height: 100%;
			background-color: var(--background);
			font-family: inherit;
			line-height: inherit;
		}

		.markers {
			position: absolute;
			overflow: hidden;
			display: none;
		}

		.popup {
			overflow: hidden;
		}

		:global {
			.maplibregl-map {
				font: inherit;
				font-weight: 500;
				z-index: 0;

				.maplibregl-ctrl-bottom-right {
					z-index: 10000;

					.maplibregl-ctrl-attrib {
						background-color: var(--background);
						color: var(--text);
						opacity: 0.75;
						font-size: 10px;
						padding: 2px 5px;
						border-top-left-radius: 5px;

						.maplibregl-ctrl-attrib-inner {
							a {
								color: var(--text);
								text-decoration: underline;
							}
						}
					}
				}
			}
		}
	}
</style>
