<script lang="ts">
	import { onMount, tick } from 'svelte';

	import MapMarker from './marker/Marker.svelte';
	import MapMarkerCircle from './marker/Circle.svelte';

	import { BoundsPair } from '../map/bounds.js';
	import { darkStyleSpecification, lightStyleSpecification } from '../map/styles.js';
	import {
		mapOptionsSchema,
		mapPopupsSchema,
		mapPopupContentCallbackSchema,
		type MapCoordinate,
		type MapBounds,
		type MapOptions,
		type MapStyle,
		type MapPopupContentCallback,
		eventHandlerSchemas,
		type EventId,
		type EventHandler,
		type EventPayloadMap
	} from '../map/input.js';
	import type { MapComponent } from '../map/types.js';

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

	let map: maplibregl.Map;
	let mapContainer: HTMLElement;

	let mapMinZoom: number;
	let mapMaxZoom: number;
	let mapMaxBounds: MapBounds | undefined;

	let mapWidth = $state<number>(0);
	let mapLoaded = $state<boolean>(false);

	onMount(() => {
		mapOptionsSchema.parse(options);

		loadMap();
		loadMapEvents();
	});

	function loadMap() {
		mapMinZoom = options.restriction?.minZoom ?? MAP_MIN_ZOOM;
		mapMaxZoom = options.restriction?.maxZoom ?? MAP_MAX_ZOOM;
		mapMaxBounds = options.restriction?.maxBounds;

		map = new maplibregl.Map({
			style: getMapLibreStyle(options.style),
			center: { lat: options.position.center.lat, lng: options.position.center.lng },
			zoom: options.position.zoom,
			minZoom: getViewportMinZoom(mapMinZoom),
			maxZoom: mapMaxZoom,
			maxBounds: mapMaxBounds
				? [mapMaxBounds.sw.lng, mapMaxBounds.sw.lat, mapMaxBounds.ne.lng, mapMaxBounds.ne.lat]
				: undefined,
			container: mapContainer,
			pitchWithRotate: false,
			attributionControl: {
				compact: false
			}
		});
	}

	//#region Events

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
		const center = map.getCenter();
		const zoom = map.getZoom();
		emit('move', { center: center, zoom: zoom });
	}

	function onMapIdle() {
		emit('idle', null);
	}

	function onMapClick(e: maplibregl.MapMouseEvent) {
		emit('click', null);
	}

	function onPopupClick(id: string) {
		emit('popup_click', id);
	}

	// Stores handlers: Map<EventId, Set<Function>>
	// Using Set to automatically handle duplicate handler registrations.
	// Storing as Function internally, but on/off methods enforce specific types.
	const handlers: Map<EventId, Set<Function>> = new Map();

	export function on<E extends EventId>(eventId: E, handler: EventHandler<E>): void {
		const schema = eventHandlerSchemas[eventId];
		if (!schema) throw new Error(`No schema defined for event ${eventId}`);

		const schemaValidationResult = schema.safeParse(handler);
		if (!schemaValidationResult.success) throw new Error(`Invalid handler for event ${eventId}`);

		if (!handlers.has(eventId)) handlers.set(eventId, new Set());
		handlers.get(eventId)?.add(handler as Function);
	}

	export function off<E extends EventId>(eventId: E, handler: EventHandler<E>): void {
		const eventHandlers = handlers.get(eventId);
		if (eventHandlers) {
			const deleted = eventHandlers.delete(handler as Function);
			if (deleted && eventHandlers.size === 0) {
				handlers.delete(eventId);
			}
		}
	}

	export function emit<E extends EventId>(eventId: E, payload: EventPayloadMap[E]): void {
		const eventHandlers = handlers.get(eventId);
		if (eventHandlers && eventHandlers.size > 0) {
			[...eventHandlers].forEach((handler) => {
				try {
					handler(payload);
				} catch (error) {
					console.error(error);
				}
			});
		}
	}

	//#endregion

	//#region Position

	function getViewportMinZoom(minZoom: number) {
		// Zoom =+ 1 doubles the width of the map
		// Min zoom has to have the whole map in window
		const mapWidthAtZoom0 = MAP_BASE_SIZE;
		const mapWidthMinZoom = Math.ceil(Math.log2(mapWidth / mapWidthAtZoom0));
		return Math.max(minZoom, mapWidthMinZoom);
	}

	export function getCenter(): MapCoordinate {
		const center = map.getCenter();
		if (!center) return { lat: options.position.center.lat, lng: options.position.center.lng };

		return { lat: center.lat, lng: center.lng };
	}

	export function getZoom() {
		return map.getZoom() ?? options.position.zoom;
	}

	export function getBounds() {
		if (!map) throw new Error('Map not loaded!');

		const bounds = map.getBounds();
		return {
			sw: { lat: bounds.getSouthWest().lat, lng: bounds.getSouthWest().lng },
			ne: { lat: bounds.getNorthEast().lat, lng: bounds.getNorthEast().lng }
		};
	}

	export function setCenter(coordinate: MapCoordinate) {
		if (!map) throw new Error('Map not loaded! Consider using the position option');

		map.setCenter(coordinate);
	}

	export function setZoom(zoom: number) {
		if (!map) throw new Error('Map not loaded! Consider using the position option');

		map.setZoom(zoom);
	}

	export function zoomIn() {
		if (!map) throw new Error('Map not loaded! Consider using the position option');

		map.zoomIn();
	}

	export function zoomOut() {
		if (!map) throw new Error('Map not loaded! Consider using the position option.');

		map.zoomOut();
	}

	export function setMinZoom(zoom: number) {
		if (!map) throw new Error('Map not loaded! Consider using the restriction option.');

		mapMinZoom = zoom;
		map.setMinZoom(getViewportMinZoom(zoom));
	}

	export function setMaxZoom(zoom: number) {
		if (!map) throw new Error('Map not loaded! Consider using the restriction option.');

		mapMaxZoom = zoom;
		map.setMaxZoom(zoom);
	}

	export function setMaxBounds(bounds: MapBounds) {
		if (!map) throw new Error('Map not loaded! Consider using the restriction option.');

		mapMaxBounds = bounds;
		map.setMaxBounds([bounds.sw.lng, bounds.sw.lat, bounds.ne.lng, bounds.ne.lat]);
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

	interface Marker {
		id: string;
		rank: number;
		lat: number;
		lng: number;
		width: number;
		height: number;
		zoom: number;
		angles: [number, number][];
	}

	class MarkerData {
		marker: Marker;
		libreMarker: maplibregl.Marker | undefined;
		element = $state<HTMLElement>();
		rendered = $state<boolean>(false);

		popup = $state<HTMLElement>();
		content = $state<HTMLElement>();
		contentLoading = $state<boolean>(false);

		component = $state<ReturnType<typeof MapMarker>>();
		circle = $state<ReturnType<typeof MapMarkerCircle>>();

		constructor(marker: Marker) {
			this.marker = marker;
			this.libreMarker = undefined;
			this.element = undefined;
			this.rendered = false;

			this.content = undefined;
			this.contentLoading = false;

			this.component = undefined;
			this.circle = undefined;
		}

		getAngle(zoom: number) {
			let angles = this.marker.angles;
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
			return (this.marker.zoom - zoom) / MAP_VISIBLE_ZOOM_DEPTH;
		}

		updateZIndex() {
			const element = this.libreMarker?.getElement();
			if (!element) throw new Error('Failed to update zIndex');

			const zIndex = Math.round((MAP_MAX_ZOOM - this.marker.zoom) * MAP_ZOOM_SCALE);
			element.style.zIndex = zIndex.toString();
		}
	}

	let mapMarkerIntervalId: number | undefined;

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
			if (marker.zoom <= zoom) {
				if (offsetBounds.contains(marker.lat, marker.lng)) {
					if (libreMarker._map != map) libreMarker.addTo(map);
					markerDataOnMap.push(data);
					continue;
				}
			}

			// Visible markers (window bounds)
			if (marker.zoom <= zoom + MAP_VISIBLE_ZOOM_DEPTH) {
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

			// Set circle rendered to true if not set
			if (!data.rendered) {
				data.rendered = true;
			}

			// Skip if circle or component not rendered
			const component = data.component;
			const circle = data.circle;
			if (!circle || !component) continue;

			// Set marker display status
			if (marker.zoom <= zoom + MAP_DISPLAYED_ZOOM_DEPTH) {
				component.setDisplayed(true);
			} else {
				component.setDisplayed(false);
			}

			// Set marker collapse status angle
			// or set circle distance
			if (marker.zoom <= zoom) {
				circle.setCollapsed(true);

				component.setCollapsed(false);
				component.setAngle(data.getAngle(zoom));
			} else {
				component.setCollapsed(true);

				circle?.setCollapsed(false);
				circle?.setDistance(data.getDistance(zoom));
			}

			// Skip if popup not rendered
			const popup = data.popup;
			if (!popup) continue;

			// Start load popup content if not loaded
			if (data.content == undefined && data.contentLoading == false) {
				data.contentLoading = true;
				mapPopupContentCallback(marker.id).then((content) => {
					data.content = content;
					data.contentLoading = false;
				});
			}

			// Skip in content not loaded
			const content = data.content;
			if (!content) continue;

			// Set popup content if null
			const element = popup.firstElementChild;
			if (element == null) {
				popup.appendChild(content);
			}
		}
	}

	async function updateMarkers(newMarkers: Marker[]) {
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

	export function setPopupContentCallback(callback: MapComponent.MapPopupContentCallback) {
		// Validate content callback
		const popupCallbackSchemaResult = mapPopupContentCallbackSchema.safeParse(callback);
		if (!popupCallbackSchemaResult.success) throw new Error('Invalid popup content callback');

		mapPopupContentCallback = callback;
	}

	export async function setPopups(popups: Types.Popup[]) {
		// Validate callback exists
		if (mapPopupContentCallback == undefined) throw new Error('Popup content callback not set');

		// Validate popups
		const popupsSchemaResult = await mapPopupsSchema.safeParseAsync(popups);
		if (!popupsSchemaResult.success) throw new Error('Invalid popups');

		try {
			emit('loading_start', null);

			// Update popups
			mapPopups = popups;

			// Get markers
			const markers = popups.map<Marker>((p) => ({
				id: p.data.id,
				rank: p.data.rank,
				lat: p.data.lat,
				lng: p.data.lng,
				width: p.data.width,
				height: p.data.height,
				zoom: p.state[0],
				angles: p.state[1]
			}));

			// Update markers
			await updateMarkers(markers);
		} finally {
			emit('loading_end', null);
		}
	}

	export function getPopups(): Types.Popup[] {
		return JSON.parse(JSON.stringify(mapPopups));
	}

	export function removePopups() {
		removeMarkers();
	}

	//#endregion
</script>

<svelte:window onresize={() => map.setMinZoom(getViewportMinZoom(mapMinZoom))} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="container"
	style="--primary: {style.colors.primary}; --background: {style.colors.background}; --text: {style.colors.text};"
>
	<div class="map" bind:this={mapContainer}></div>
	<div class="logo"><a href="https://arenarium.dev" target="_blank">@arenarium/maps</a></div>
	<div class="markers">
		{#each mapMarkerArray as data (data.marker.id)}
			<div class="marker" bind:this={data.element}>
				{#if data.rendered}
					<MapMarkerCircle bind:this={data.circle} />
					<MapMarker bind:this={data.component}>
						<div
							class="popup"
							style="width: {data.marker.width}px; height: {data.marker.height}px;"
							onclick={() => onPopupClick(data.marker.id)}
							bind:this={data.popup}
						></div>
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
			background-color: color-mix(in srgb, var(--background) 50%, transparent 50%);
			color: var(--text);
			font-size: 10px;
			padding: 2px 5px;
			border-top-right-radius: 5px;
			box-shadow: 1px -1px 2px rgba(0, 0, 0, 0.2);

			a {
				color: var(--text);
				text-decoration: none;
				font-weight: 600;
			}
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
						padding: 2px 5px;
						border-top-left-radius: 5px;
						box-shadow: -1px -1px 2px rgba(0, 0, 0, 0.2);

						.maplibregl-ctrl-attrib-inner {
							a {
								color: var(--text);
								font-weight: 600;
							}
						}
					}
				}
			}
		}
	}
</style>
