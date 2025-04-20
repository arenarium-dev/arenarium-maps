<script lang="ts">
	import { onMount, tick } from 'svelte';

	import MapMarker from './marker/Marker.svelte';
	import MapMarkerCircle from './marker/Circle.svelte';

	import { getMarkers } from '../map/data/markers.js';
	import { BoundsPair } from '../map/data/bounds.js';
	import { darkStyleSpecification, lightStyleSpecification } from '../map/styles.js';
	import {
		mapOptionsSchema,
		mapPopupsSchema,
		mapPopupContentCallbackSchema,
		type MapOptions,
		type MapStyle,
		type MapPopupContentCallback,
		type MapPopupCallback,
		type MapCoordinate
	} from '../map/input.js';

	import {
		MAP_BASE_SIZE,
		MAP_DISPLAYED_ZOOM_DEPTH,
		MAP_MAX_ZOOM,
		MAP_MIN_ZOOM,
		MAP_VISIBLE_ZOOM_DEPTH,
		MAP_ZOOM_SCALE
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
			style: getMapLibreStyle(options.style),
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

	function onPopupClick(id: string) {
		options.events?.onPopupClick?.call(null, id);
	}

	function onWindowResize() {
		setMapMinZoom(getMapMinZoom());
	}

	//#region Position

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

	export function getCenter(): MapCoordinate {
		const center = map?.getCenter();
		if (!center) return { lat: options.position.center.lat, lng: options.position.center.lng };

		return { lat: center.lat, lng: center.lng };
	}

	export function setCenter(coordinate: MapCoordinate) {
		map?.setCenter(coordinate);
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

	//#region Styles

	let style = $state<MapStyle>(options.style);

	$effect(() => {
		if (mapLoaded) {
			map.setStyle(getMapLibreStyle(style), { diff: true });
		}
	});

	function getMapLibreStyle(style: MapStyle) {
		if (style.url) return style.url;

		switch (style.name) {
			case 'light':
				return lightStyleSpecification;
			case 'dark':
				return darkStyleSpecification;
		}
	}

	export function getStyle() {
		return $state.snapshot(style);
	}

	export function setStyle(value: MapStyle) {
		style = value;
		map.setStyle(getMapLibreStyle(style), { diff: true });
	}

	//#endregion

	//#region Data

	class MarkerData {
		marker: Types.Marker;
		libreMarker: maplibregl.Marker | undefined;
		element = $state<HTMLElement>();

		content = $state<string>();
		contentLoading = $state<boolean>(false);

		component = $state<ReturnType<typeof MapMarker>>();
		componentRendered = $state<boolean>(false);

		circle = $state<ReturnType<typeof MapMarkerCircle>>();
		circleRendered = $state<boolean>(false);

		constructor(marker: Types.Marker) {
			this.marker = marker;
			this.libreMarker = undefined;
			this.element = undefined;

			this.content = undefined;
			this.contentLoading = false;

			this.component = undefined;
			this.componentRendered = false;

			this.circle = undefined;
			this.circleRendered = false;
		}

		getAngle(zoom: number) {
			let angles = this.marker.angs;
			let angle = angles[0];
			let index = 0;

			while (angle[0] < zoom) {
				index++;
				if (index == angles.length) break;
				angle = angles[index];
			}

			return angle[1];
		}

		getDistance(zoom: number) {
			return (this.marker.zet - zoom) / MAP_VISIBLE_ZOOM_DEPTH;
		}

		updateZIndex() {
			const element = this.libreMarker?.getElement();
			if (!element) throw new Error('Failed to update zIndex');

			const zIndex = Math.round((MAP_MAX_ZOOM - this.marker.zet) * MAP_ZOOM_SCALE);
			element.style.zIndex = zIndex.toString();
		}
	}

	let mapMarkerIntervalId: number | undefined;
	let mapPopupsIntervalId: number | undefined;

	let mapMarkerArray = $state(new Array<MarkerData>());
	let mapMarkerMap = $state(new Map<string, MarkerData>());

	let mapPopups = new Array<Types.Popup>();
	let mapPopupContentCallback: MapPopupContentCallback | undefined = undefined;

	onMount(() => {
		const markersLoop = () => {
			processMarkers();
			mapMarkerIntervalId = window.setTimeout(markersLoop, 25);
		};

		markersLoop();

		return () => {
			clearInterval(mapMarkerIntervalId);
			clearInterval(mapPopupsIntervalId);
		};
	});

	function processMarkers() {
		// Check if map is loaded or marker data is empty
		if (mapLoaded == false) return;
		if (mapMarkerArray.length == 0) return;
		if (mapPopupContentCallback == undefined) return;

		// Get map zoom
		const zoom = map.getZoom();
		if (!zoom) return;

		// Get markers on map
		const markerDataOnMap = new Array<MarkerData>();

		const offset = MAP_BASE_SIZE;
		const offsetBounds = new BoundsPair(map, -offset, window.innerHeight + offset, window.innerWidth + offset, -offset);
		const windowBounds = new BoundsPair(map, 0, window.innerHeight, window.innerWidth, 0);

		for (let i = 0; i < mapMarkerArray.length; i++) {
			const data = mapMarkerArray[i];
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

			// Load marker content if not loaded
			if (data.content == undefined && data.contentLoading == false) {
				data.contentLoading = true;
				mapPopupContentCallback(marker.id).then((content) => {
					data.content = content;
					data.contentLoading = false;
				});
			}

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
				component?.setAngle(data.getAngle(zoom));
			} else {
				component?.setCollapsed(true);

				circle?.setCollapsed(false);
				circle?.setDistance(data.getDistance(zoom));
			}
		}
	}

	async function updateMarkers(newMarkers: Types.Marker[]) {
		const newMarkerMap = new Map(newMarkers.map((m) => [m.id, new MarkerData(m)]));
		const newDataList = new Array<MarkerData>();

		// Remove old data
		const oldDataList = Array.from(mapMarkerArray);
		for (const oldData of oldDataList) {
			if (newMarkerMap.has(oldData.marker.id) == false) {
				oldData.libreMarker?.remove();

				mapMarkerMap.delete(oldData.marker.id);
				mapMarkerArray.splice(mapMarkerArray.indexOf(oldData), 1);
			}
		}

		// Crate or update new data
		for (const newMarker of newMarkers) {
			// Check if marker already exists
			const oldData = mapMarkerMap.get(newMarker.id);

			if (oldData) {
				// Update marker data
				oldData.marker = newMarker;
				oldData.updateZIndex();
			} else {
				// Create marker data
				const newData = new MarkerData(newMarker);
				mapMarkerMap.set(newMarker.id, newData);
				mapMarkerArray.push(newData);
				newDataList.push(newData);
			}
		}

		// Wait for new markers content to be rendered
		await tick();

		// Add new libre markers
		for (const newData of newDataList) {
			const marker = newData.marker;
			const element = newData.element;
			if (!element) throw new Error('Failed to render marker element.');

			// Create new libre marker
			const mapLibreMarker = new maplibregl.Marker({ element });
			mapLibreMarker.setLngLat([marker.lng, marker.lat]);

			newData.libreMarker = mapLibreMarker;
			newData.updateZIndex();
		}
	}

	function removeMarkers() {
		for (let i = 0; i < mapMarkerArray.length; i++) {
			const data = mapMarkerArray[i];
			data.libreMarker?.remove();
		}
		mapMarkerArray.length = 0;
		mapMarkerMap.clear();
	}

	export function updatePopupsContentCallback(callback: MapPopupContentCallback) {
		// Validate content callback
		const popupCallbackSchemaResult = mapPopupContentCallbackSchema.safeParse(callback);
		if (!popupCallbackSchemaResult.success) throw new Error('Invalid popup content callback');

		mapPopupContentCallback = callback;
	}

	export async function updatePopups(popups: Types.Popup[]) {
		// Validate callback exists
		if (mapPopupContentCallback == undefined) throw new Error('Popup content callback not set');

		// Validate popups
		const popupsSchemaResult = await mapPopupsSchema.safeParseAsync(popups);
		if (!popupsSchemaResult.success) throw new Error('Invalid popups');

		try {
			options.events?.onLoadingStart?.call(null);

			// Update popups
			for (const popup of popups) {
				const mapPopupIndex = mapPopups.findIndex((p) => p.id == popup.id);
				if (mapPopupIndex == -1) {
					mapPopups.push(popup);
				} else {
					mapPopups[mapPopupIndex] = popup;
				}
			}

			// Update markers
			await updateMarkers(await getMarkers(mapPopups));
		} finally {
			options.events?.onLoadingEnd?.call(null);
		}
	}

	export function removePopups() {
		removeMarkers();
	}

	//#endregion
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" />
	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@1,100..900&display=swap" />
</svelte:head>

<svelte:window onresize={onWindowResize} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="container"
	style="--primary: {style.colors.primary}; --background: {style.colors.background}; --text: {style.colors.text};"
>
	<div class="map" bind:this={mapContainer}></div>
	<div class="markers">
		{#each mapMarkerArray as data (data.marker.id)}
			<div class="marker" bind:this={data.element}>
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
		font-family: 'Roboto';
		box-sizing: border-box;
		touch-action: manipulation;
		overflow: hidden;

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
				z-index: 0;

				.maplibregl-ctrl-bottom-right {
					z-index: 10000;

					.maplibregl-ctrl-attrib {
						background-color: color-mix(in srgb, var(--background) 50%, transparent 50%);
						color: var(--text);
						font-size: 10px;
						font-family: 'Roboto';
						padding: 2px 5px;
						border-top-left-radius: 5px;
						box-shadow: -1px -1px 2px rgba(0, 0, 0, 0.2);

						.maplibregl-ctrl-attrib-inner {
							a {
								color: var(--text);
								font-weight: 500;
							}
						}
					}
				}
			}
		}
	}
</style>
