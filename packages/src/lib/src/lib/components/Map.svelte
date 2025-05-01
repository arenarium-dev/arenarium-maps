<script lang="ts">
	import { onMount } from 'svelte';

	import MapMarker from './marker/Marker.svelte';
	import MapMarkerCircle from './marker/Circle.svelte';

	import { MapBoundsPair } from '../map/bounds.js';
	import { darkStyleSpecification, lightStyleSpecification } from '../map/styles.js';
	import {
		mapOptionsSchema,
		mapPopupsSchema,
		type MapCoordinate,
		type MapBounds,
		type MapOptions,
		type MapStyle,
		type MapPopup,
		type MapPopupContentCallback,
		eventHandlerSchemas,
		type EventId,
		type EventHandler,
		type EventPayloadMap
	} from '../map/input.js';

	import {
		MAP_BASE_SIZE,
		MAP_DISPLAYED_ZOOM_DEPTH,
		MAP_MAX_ZOOM,
		MAP_MIN_ZOOM,
		MAP_VISIBLE_ZOOM_DEPTH,
		MAP_ZOOM_SCALE
	} from '@workspace/shared/src/constants.js';

	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';

	let { options }: { options: MapOptions } = $props();

	let map: maplibregl.Map;
	let mapContainer: HTMLElement;

	let mapMinZoom: number;
	let mapMaxZoom: number;
	let mapMaxBounds: MapBounds | undefined;

	let mapWidth = $state<number>(0);
	let mapHeight = $state<number>(0);
	let mapLoaded = $state<boolean>(false);
	let mapBounds = $state<MapBounds>();

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
			maxBounds: mapMaxBounds ? [mapMaxBounds.sw.lng, mapMaxBounds.sw.lat, mapMaxBounds.ne.lng, mapMaxBounds.ne.lat] : undefined,
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

		const bounds = map.getBounds();
		mapBounds = {
			sw: { lat: bounds.getSouthWest().lat, lng: bounds.getSouthWest().lng },
			ne: { lat: bounds.getNorthEast().lat, lng: bounds.getNorthEast().lng }
		};
	}

	function onMapIdle() {
		emit('idle', null);

		const bounds = map.getBounds();
		mapBounds = {
			sw: { lat: bounds.getSouthWest().lat, lng: bounds.getSouthWest().lng },
			ne: { lat: bounds.getNorthEast().lat, lng: bounds.getNorthEast().lng }
		};
	}

	function onMapClick(e: maplibregl.MapMouseEvent) {
		emit('click', { lat: e.lngLat.lat, lng: e.lngLat.lng });
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

	export class MapMarkerData {
		id: string;
		rank: number;
		lat: number;
		lng: number;
		width: number;
		height: number;
		zoom: number;
		angles: [number, number][];

		element = $state<HTMLElement>();
		libreMarker: maplibregl.Marker | undefined;

		rendered = $state<boolean>(false);
		component = $state<ReturnType<typeof MapMarker>>();
		circle = $state<ReturnType<typeof MapMarkerCircle>>();

		content = $state<HTMLElement>();
		contentDiv = $state<HTMLElement>();
		contentLoading = false;
		contentCallback: MapPopupContentCallback;

		constructor(popup: MapPopup) {
			this.id = popup.data.id;
			this.rank = popup.data.rank;
			this.lat = popup.data.lat;
			this.lng = popup.data.lng;
			this.width = popup.data.width;
			this.height = popup.data.height;
			this.zoom = popup.state[0];
			this.angles = popup.state[1];

			this.element = undefined;
			this.libreMarker = undefined;

			this.rendered = false;
			this.component = undefined;
			this.circle = undefined;

			this.content = undefined;
			this.contentDiv = undefined;
			this.contentLoading = false;
			this.contentCallback = popup.contentCallback;
		}

		createLibreMarker() {
			const element = this.element;
			if (!element) throw new Error('Failed to create libre marker');

			// Create new libre marker
			const mapLibreMarker = new maplibregl.Marker({ element });
			mapLibreMarker.setLngLat([this.lng, this.lat]);

			this.libreMarker = mapLibreMarker;
			this.updateZIndex();
		}

		updateZIndex() {
			const element = this.element;
			if (!element) throw new Error('Failed to update zIndex');

			const zIndex = Math.round((MAP_MAX_ZOOM - this.zoom) * MAP_ZOOM_SCALE);
			element.style.zIndex = zIndex.toString();
		}

		updateMap(map: maplibregl.Map | null) {
			if (!this.libreMarker) throw new Error('Failed to update map');

			if (this.libreMarker._map != map) {
				if (map) {
					this.libreMarker.addTo(map);
					this.component?.setDisplayed(true);
				} else {
					this.libreMarker.remove();
					this.component?.setDisplayed(false);
				}
			}
		}

		updateState(zoom: number) {
			const component = this.component;
			const circle = this.circle;
			if (!component || !circle) throw new Error('Failed to update state');

			// Set marker collapse status angle
			// or set circle distance
			if (this.zoom <= zoom) {
				circle.setCollapsed(true);

				component.setCollapsed(false);
				component.setAngle(this.getAngle(zoom));
			} else {
				component.setCollapsed(true);

				circle.setCollapsed(false);
				circle.setDistance(this.getDistance(zoom));
			}
		}

		updateContent() {
			if (this.contentLoading) return;

			this.contentLoading = true;
			this.contentCallback(this.id).then((content) => {
				if (this.contentDiv == undefined) return;
				this.contentDiv.appendChild(content);

				this.content = content;
				this.contentLoading = false;
			});
		}

		isInBlock(zoom: number, bounds: MapBoundsPair) {
			return this.zoom <= zoom && bounds.contains(this.lat, this.lng);
		}

		getAngle(zoom: number) {
			let angles = this.angles;
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
			return (this.zoom - zoom) / MAP_VISIBLE_ZOOM_DEPTH;
		}

		getExpanded() {
			if (!this.component) return false;
			return this.component.getCollapsed() == false;
		}
	}

	let mapMarkerIntervalId: number | undefined;

	let mapMarkerArray = $state(new Array<MapMarkerData>());
	let mapMarkerMap = $state(new Map<string, MapMarkerData>());

	let offset = MAP_BASE_SIZE;
	let mapOffsetBounds = $derived(mapBounds ? new MapBoundsPair(map!, -offset, mapHeight + offset, mapWidth + offset, -offset) : undefined);
	let mapWindowBounds = $derived(mapBounds ? new MapBoundsPair(map!, 0, mapHeight, mapWidth, 0) : undefined);

	onMount(() => {
		const markersLoop = () => {
			processMarkers();
			mapMarkerIntervalId = window.setTimeout(markersLoop, 25);
		};

		markersLoop();

		return () => clearInterval(mapMarkerIntervalId);
	});

	function processMarkers() {
		// Check if map is loaded or marker data is empty
		if (mapLoaded == false) return;
		if (mapMarkerArray.length == 0) return;
		if (mapOffsetBounds == undefined) return;
		if (mapWindowBounds == undefined) return;

		// Get map zoom
		const zoom = map.getZoom();
		if (!zoom) return;

		// Get/Create markers on map
		const markersWithElements = new Array<MapMarkerData>();

		for (const marker of mapMarkerArray) {
			// Check if libre marker exists (marker is on map)
			if (marker.libreMarker) {
				markersWithElements.push(marker);
			}
			// Check if element rendered
			else if (marker.element) {
				// Create new libre marker
				marker.createLibreMarker();
				markersWithElements.push(marker);
			}
		}

		// Get markers inside visible bounds
		const markersInBounds = new Array<MapMarkerData>();
		const mapOffsetZoom = zoom;
		const mapWindowZoom = zoom + MAP_VISIBLE_ZOOM_DEPTH;

		for (const marker of markersWithElements) {
			// Check if marker is in offset or window bounds
			if (marker.isInBlock(mapOffsetZoom, mapOffsetBounds) || marker.isInBlock(mapWindowZoom, mapWindowBounds)) {
				marker.updateMap(map);
				markersInBounds.push(marker);
			} else {
				marker.updateMap(null);
			}
		}

		// Get displayed markers inside bounds
		const markersExpanded = new Array<MapMarkerData>();

		for (const marker of markersInBounds) {
			// Set marker rendered flag to true if not
			marker.rendered = true;
			// Check if marker components are rendered
			if (!marker.component || !marker.circle) continue;

			// Update marker state
			marker.updateState(zoom);
			// Add marker if expanded
			if (marker.getExpanded()) markersExpanded.push(marker);
		}

		// Process markers that are displayed
		for (const marker of markersExpanded) {
			// Skip if content div not rendered
			if (marker.contentDiv == undefined) continue;
			// Check if content is already loaded or loading
			if (marker.content != undefined || marker.contentLoading) continue;
			// Start load popup content if not loaded
			marker.updateContent();
		}
	}

	async function updateMarkers(newPopups: MapPopup[]) {
		const newPopupsMap = new Map(newPopups.map((m) => [m.data.id, new MapMarkerData(m)]));
		const newMarkerArray = new Array<MapMarkerData>();

		// Remove old markers
		const oldMarkerArray = Array.from(mapMarkerArray);
		for (const oldMarker of oldMarkerArray) {
			if (newPopupsMap.has(oldMarker.id) == false) {
				oldMarker.libreMarker?.remove();

				mapMarkerMap.delete(oldMarker.id);
				mapMarkerArray.splice(mapMarkerArray.indexOf(oldMarker), 1);
			}
		}

		// Crate or update new markers
		for (const newPopup of newPopups) {
			// Check if marker already exists
			const oldMarker = mapMarkerMap.get(newPopup.data.id);

			if (oldMarker) {
				// Update marker state
				oldMarker.zoom = newPopup.state[0];
				oldMarker.angles = newPopup.state[1];
				oldMarker.updateZIndex();
			} else {
				// Create marker data
				const newMarker = new MapMarkerData(newPopup);
				mapMarkerMap.set(newPopup.data.id, newMarker);
				mapMarkerArray.push(newMarker);
				newMarkerArray.push(newMarker);
			}
		}
	}

	function removeMarkers() {
		for (let i = 0; i < mapMarkerArray.length; i++) {
			const marker = mapMarkerArray[i];
			marker.libreMarker?.remove();
		}

		mapMarkerArray.length = 0;
		mapMarkerMap.clear();
	}

	export async function updatePopups(popups: MapPopup[]) {
		// Validate popups
		const popupsSchemaResult = await mapPopupsSchema.safeParseAsync(popups);
		if (!popupsSchemaResult.success) throw new Error('Invalid popups');

		// Update markers
		await updateMarkers(popups);
	}

	export function removePopups() {
		removeMarkers();
	}

	//#endregion
</script>

<svelte:window onresize={() => map.setMinZoom(getViewportMinZoom(mapMinZoom))} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="container" style="--primary: {style.colors.primary}; --background: {style.colors.background}; --text: {style.colors.text};">
	<div class="map" bind:this={mapContainer} bind:clientWidth={mapWidth} bind:clientHeight={mapHeight}></div>
	<div class="logo"><a href="https://arenarium.dev" target="_blank">@arenarium/maps</a></div>
	<div class="markers">
		{#each mapMarkerArray as marker (marker.id)}
			<div class="marker" bind:this={marker.element}>
				{#if marker.rendered}
					<MapMarkerCircle bind:this={marker.circle} />
					<MapMarker bind:this={marker.component}>
						<div class="popup" style="width: {marker.width}px; height: {marker.height}px;" bind:this={marker.contentDiv}></div>
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
