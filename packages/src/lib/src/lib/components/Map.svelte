<script lang="ts">
	import { mount, onMount } from 'svelte';

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
	} from '../map/schemas.js';

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

	class MapPopupComponent<T> {
		id: string;
		lat: number;
		lng: number;
		zoom: number;

		element: HTMLElement | undefined;
		component: T | undefined;
		libreMarker: maplibregl.Marker | undefined;

		constructor(popup: MapPopup) {
			this.id = popup.data.id;
			this.lat = popup.data.lat;
			this.lng = popup.data.lng;
			this.zoom = popup.state[0];

			this.element = undefined;
			this.component = undefined;
			this.libreMarker = undefined;
		}

		createLibreMarker() {
			const element = this.element;
			if (!element) throw new Error('Failed to create libre marker');

			// Create new libre marker
			const libreMarker = new maplibregl.Marker({ element: element });
			libreMarker.setLngLat([this.lng, this.lat]);
			this.libreMarker = libreMarker;
		}

		isCreated() {
			return this.element != undefined;
		}

		isInBlock(zoom: number, bounds: MapBoundsPair) {
			return this.zoom <= zoom && bounds.contains(this.lat, this.lng);
		}
	}

	class MapPopupCircle extends MapPopupComponent<ReturnType<typeof MapMarkerCircle>> {
		pinLoading = false;
		pinLoaded = false;
		pinCallback: MapPopupContentCallback | undefined;

		constructor(popup: MapPopup) {
			super(popup);

			this.pinCallback = popup.callbacks.pin;
		}

		createElement() {
			this.element = document.createElement('div');
			this.element.classList.add('circle');
			this.component = mount(MapMarkerCircle, { target: this.element });

			this.createLibreMarker();
			this.updateZIndex();
		}

		updateZIndex() {
			const element = this.element;
			if (!element) return;

			const zIndex = Math.round((MAP_MAX_ZOOM - this.zoom) * MAP_ZOOM_SCALE);
			element.style.zIndex = zIndex.toString();
		}

		updateMap(map: maplibregl.Map | null) {
			const libreMarker = this.libreMarker;
			const component = this.component;
			if (libreMarker == undefined || component == undefined) throw new Error('Failed to update circle map');

			if (libreMarker._map != map) {
				if (map) {
					libreMarker.addTo(map);
					component.setDisplayed(true);
				} else {
					libreMarker.remove();
					component.setDisplayed(false);
				}
			}
		}

		updateState(zoom: number) {
			const circle = this.component;
			if (!circle) throw new Error('Failed to update circle state');

			// Set circle scale
			if (this.zoom <= zoom) {
				circle.setScale(0);
			} else {
				const distance = (this.zoom - zoom) / MAP_VISIBLE_ZOOM_DEPTH;
				const scale = 1 - distance * 0.3;
				circle.setScale(scale);
			}
		}

		updatePin() {
			if (this.pinCallback == undefined) return;
			if (this.pinLoaded || this.pinLoading) return;

			const pin = this.component?.getBody();
			if (pin == undefined) return;

			this.pinLoading = true;
			this.pinCallback(this.id).then((content) => {
				pin.appendChild(content);
				this.pinLoaded = true;
				this.pinLoading = false;
			});
		}

		setCollapsed() {
			if (this.component == undefined) return;
			this.component.setScale(0);
		}

		isCollapsed() {
			if (this.component == undefined) return false;
			return this.component.getInvisible();
		}

		isPinLoaded() {
			return this.pinCallback == undefined || this.pinLoaded;
		}
	}

	class MapPopupMarker extends MapPopupComponent<ReturnType<typeof MapMarker>> {
		width: number;
		height: number;
		states: [number, number][];

		bodyLoading = false;
		bodyLoaded = false;
		bodyCallback: MapPopupContentCallback;

		constructor(popup: MapPopup) {
			super(popup);

			this.id = popup.data.id;
			this.states = popup.state[1];
			this.width = popup.data.width;
			this.height = popup.data.height;

			this.bodyCallback = popup.callbacks.body;
		}

		createElement() {
			this.element = document.createElement('div');
			this.element.classList.add('marker');
			this.component = mount(MapMarker, { target: this.element, props: { width: this.width, height: this.height } });

			this.createLibreMarker();
			this.updateZIndex();
		}

		updateZIndex() {
			const element = this.element;
			if (!element) return;

			const zIndex = Math.round((MAP_MAX_ZOOM - this.zoom) * MAP_ZOOM_SCALE) + 1000000;
			element.style.zIndex = zIndex.toString();
		}

		updateMap(map: maplibregl.Map | null) {
			const libreMarker = this.libreMarker;
			const component = this.component;
			if (libreMarker == undefined || component == undefined) throw new Error('Failed to update marker map');

			if (libreMarker._map != map) {
				if (map) {
					libreMarker.addTo(map);
					component.setDisplayed(true);
				} else {
					libreMarker.remove();
					component.setDisplayed(false);
				}
			}
		}

		updateState(zoom: number) {
			const marker = this.component;
			if (!marker) throw new Error('Failed to update marker state');

			// Set marker collapse status and angle
			if (this.zoom <= zoom) {
				marker.setCollapsed(false);
				marker.setAngle(this.getAngle(zoom));
			} else {
				marker.setCollapsed(true);
			}
		}

		updateBody() {
			// Check if content is already loaded or loading
			if (this.bodyLoaded || this.bodyLoading) return;

			// Check if content div rendered
			const body = this.component?.getBody();
			if (body == undefined) return;

			// Load body callback
			this.bodyLoading = true;
			this.bodyCallback(this.id).then((content) => {
				body.appendChild(content);
				this.bodyLoading = false;
				this.bodyLoaded = true;
			});
		}

		getAngle(zoom: number) {
			const state = this.states.findLast((s) => s[0] <= zoom);
			if (!state) throw new Error('Angle not found');
			return state[1];
		}

		getExpanded() {
			if (!this.component) return false;
			return this.component.getExpanded();
		}

		isCollapsed() {
			if (!this.component) return false;
			return this.component.getCollapsed();
		}

		isBodyLoaded() {
			return this.bodyLoaded;
		}
	}

	class MapPopupData {
		id: string;
		rank: number;
		lat: number;
		lng: number;
		zoom: number;

		circle: MapPopupCircle;
		marker: MapPopupMarker;

		constructor(popup: MapPopup) {
			this.id = popup.data.id;
			this.rank = popup.data.rank;
			this.lat = popup.data.lat;
			this.lng = popup.data.lng;
			this.zoom = popup.state[0];

			this.circle = new MapPopupCircle(popup);
			this.marker = new MapPopupMarker(popup);
		}
	}

	let mapPopupsIntervalId: number | undefined;

	let mapPopupDataArray = new Array<MapPopupData>();
	let mapPopupDataMap = new Map<string, MapPopupData>();

	let offset = MAP_BASE_SIZE;
	let mapOffsetBounds = $derived(mapBounds ? new MapBoundsPair(map!, -offset, mapHeight + offset, mapWidth + offset, -offset) : undefined);
	let mapWindowBounds = $derived(mapBounds ? new MapBoundsPair(map!, 0, mapHeight, mapWidth, 0) : undefined);

	onMount(() => {
		const loop = () => {
			processPopupData();
			mapPopupsIntervalId = window.setTimeout(loop, 25);
		};

		loop();
		return () => clearInterval(mapPopupsIntervalId);
	});

	function processPopupData() {
		// Check if map is loaded or marker data is empty
		if (mapLoaded == false) return;
		if (mapWindowBounds == undefined) return;
		if (mapOffsetBounds == undefined) return;
		if (mapPopupDataArray.length == 0) return;

		// Get map zoom
		const zoom = map.getZoom();
		if (!zoom) return;

		for (const data of mapPopupDataArray) {
			// Process popup circle
			processPopupCircle(data.circle, zoom, mapWindowBounds);
			// Process popup marker
			processPopupMarker(data.marker, zoom, mapOffsetBounds);
		}
	}

	function processPopupCircle(circle: MapPopupCircle, zoom: number, bounds: MapBoundsPair) {
		// Check if circle is in bounds
		if (circle.isInBlock(zoom + MAP_VISIBLE_ZOOM_DEPTH, bounds)) {
			// Check if circle exist on map
			if (circle.isCreated() == false) {
				circle.createElement();
			}

			// Update circle map and state
			circle.updateMap(map);
			circle.updateState(zoom);

			// Update circle pin if not loaded
			if (circle.isPinLoaded() == false) {
				circle.updatePin();
			}
		} else {
			if (circle.isCreated() == true) {
				// Set circle invisible
				circle.setCollapsed();
				// Wait until circle is invisible before removing it
				if (circle.isCollapsed()) {
					circle.updateMap(null);
				}
			}
		}
	}

	function processPopupMarker(marker: MapPopupMarker, zoom: number, bounds: MapBoundsPair) {
		// Check if marker is in bounds
		if (marker.isInBlock(zoom + MAP_DISPLAYED_ZOOM_DEPTH, bounds)) {
			// Check if marker exist on map
			if (marker.isCreated() == false) {
				marker.createElement();
			}

			// Update marker map and state
			marker.updateMap(map);
			marker.updateState(zoom);

			// If marker is expanded, update body if not loaded
			if (marker.getExpanded() && marker.isBodyLoaded() == false) {
				marker.updateBody();
			}
		} else {
			// Check if marker exist on map
			if (marker.isCreated() == true) {
				// Wait until marker is collapsed before removing it
				if (marker.isCollapsed()) {
					marker.updateMap(null);
				} else {
					marker.updateState(zoom);
				}
			}
		}
	}

	async function updatePopupData(newPopups: MapPopup[]) {
		const newPopupsMap = new Map(newPopups.map((m) => [m.data.id, new MapPopupData(m)]));
		const newDataArray = new Array<MapPopupData>();

		// Remove old data
		const oldDataArray = Array.from(mapPopupDataArray);
		for (const oldData of oldDataArray) {
			if (newPopupsMap.has(oldData.id) == false) {
				oldData.circle.libreMarker?.remove();
				oldData.marker.libreMarker?.remove();

				mapPopupDataMap.delete(oldData.id);
				mapPopupDataArray.splice(mapPopupDataArray.indexOf(oldData), 1);
			}
		}

		// Crate or update new data
		for (const newPopup of newPopups) {
			// Check if data already exists
			const oldData = mapPopupDataMap.get(newPopup.data.id);

			if (oldData) {
				// Update data state
				oldData.circle.zoom = newPopup.state[0];
				oldData.circle.updateZIndex();

				oldData.marker.zoom = newPopup.state[0];
				oldData.marker.states = newPopup.state[1];
				oldData.marker.updateZIndex();
			} else {
				// Create data
				const newData = new MapPopupData(newPopup);
				mapPopupDataMap.set(newPopup.data.id, newData);
				mapPopupDataArray.push(newData);
				newDataArray.push(newData);
			}
		}
	}

	function removePopupData() {
		for (const data of mapPopupDataArray) {
			data.circle.libreMarker?.remove();
			data.marker.libreMarker?.remove();
		}

		mapPopupDataArray.length = 0;
		mapPopupDataMap.clear();
	}

	export async function updatePopups(popups: MapPopup[]) {
		// Validate popups
		const popupsSchemaResult = await mapPopupsSchema.safeParseAsync(popups);
		if (!popupsSchemaResult.success) throw new Error('Invalid popups');

		// Update data
		await updatePopupData(popups);
	}

	export function removePopups() {
		removePopupData();
	}

	export function revealPopup(id: string) {
		const popup = mapPopupDataMap.get(id);
		if (popup == undefined) return;

		map.flyTo({ center: { lat: popup.lat, lng: popup.lng }, zoom: popup.zoom });
	}

	//#endregion
</script>

<svelte:window onresize={() => map.setMinZoom(getViewportMinZoom(mapMinZoom))} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="container" style="--primary: {style.colors.primary}; --background: {style.colors.background}; --text: {style.colors.text};">
	<div class="map" bind:this={mapContainer} bind:clientWidth={mapWidth} bind:clientHeight={mapHeight}></div>
	<div class="logo"><a href="https://arenarium.dev" target="_blank">@arenarium/maps</a></div>
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

		:global {
			.maplibregl-map {
				z-index: 0;

				.maplibregl-ctrl-bottom-right {
					z-index: 10000000;

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
