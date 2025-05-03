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

	export class MapPopupData {
		id: string;
		rank: number;
		lat: number;
		lng: number;
		width: number;
		height: number;
		zoom: number;
		angles: [number, number][];

		circleElement = $state<HTMLElement>();
		circleComponent = $state<ReturnType<typeof MapMarkerCircle>>();
		circleLibreMarker: maplibregl.Marker | undefined;

		markerElement = $state<HTMLElement>();
		markerComponent = $state<ReturnType<typeof MapMarker>>();
		markerLibreMarker: maplibregl.Marker | undefined;

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

			this.circleElement = undefined;
			this.circleComponent = undefined;
			this.circleLibreMarker = undefined;

			this.markerElement = undefined;
			this.markerComponent = undefined;
			this.markerLibreMarker = undefined;

			this.content = undefined;
			this.contentDiv = undefined;
			this.contentLoading = false;
			this.contentCallback = popup.contentCallback;
		}

		createCircleLibreMarker() {
			const circleElement = this.circleElement;
			if (!circleElement) throw new Error('Failed to create libre marker');

			// Create new libre marker
			const circleLibreMarker = new maplibregl.Marker({ element: circleElement });
			circleLibreMarker.setLngLat([this.lng, this.lat]);
			this.circleLibreMarker = circleLibreMarker;

			// Update zIndex
			this.updateCircleZIndex();
		}

		createMarkerLibreMarker() {
			const markerElement = this.markerElement;
			if (!markerElement) throw new Error('Failed to create libre marker');

			// Create new libre marker
			const markerLibreMarker = new maplibregl.Marker({ element: markerElement });
			markerLibreMarker.setLngLat([this.lng, this.lat]);
			this.markerLibreMarker = markerLibreMarker;

			// Update zIndex
			this.updateMarkerZIndex();
		}

		updateCircleZIndex() {
			const circleElement = this.circleElement;
			if (!circleElement) throw new Error('Failed to update zIndexes');

			const zIndex = Math.round((MAP_MAX_ZOOM - this.zoom) * MAP_ZOOM_SCALE);
			circleElement.style.zIndex = zIndex.toString();
		}

		updateMarkerZIndex() {
			const markerElement = this.markerElement;
			if (!markerElement) throw new Error('Failed to update zIndexes');

			const zIndex = Math.round((MAP_MAX_ZOOM - this.zoom) * MAP_ZOOM_SCALE) + Number.MAX_SAFE_INTEGER / 2;
			markerElement.style.zIndex = zIndex.toString();
		}

		updateCircleMap(map: maplibregl.Map | null) {
			if (this.circleLibreMarker == undefined) throw new Error('Failed to update circle map');

			if (this.circleLibreMarker._map != map) {
				if (map) this.circleLibreMarker.addTo(map);
				else this.circleLibreMarker.remove();
			}
		}

		updateMarkerMap(map: maplibregl.Map | null) {
			if (this.markerLibreMarker == undefined) throw new Error('Failed to update marker map');

			if (this.markerLibreMarker._map != map) {
				if (map) {
					this.markerLibreMarker.addTo(map);
					this.markerComponent?.setDisplayed(true);
				} else {
					this.markerLibreMarker.remove();
					this.markerComponent?.setDisplayed(false);
				}
			}
		}

		updateCircleState(zoom: number) {
			const circle = this.circleComponent;
			if (!circle) throw new Error('Failed to update circle state');

			// Set circle scale
			if (this.zoom <= zoom) {
				circle.setScale(0);
			} else {
				const distance = (this.zoom - zoom) / MAP_VISIBLE_ZOOM_DEPTH;
				const scale = 1 - distance * 0.5;
				circle.setScale(scale);
			}
		}

		updateMarkerState(zoom: number) {
			const marker = this.markerComponent;
			if (!marker) throw new Error('Failed to update marker state');

			// Set marker collapse status and angle
			if (this.zoom <= zoom) {
				marker.setCollapsed(false);
				marker.setAngle(this.getAngle(zoom));
			} else {
				marker.setCollapsed(true);
			}
		}

		updateMarkerContent() {
			// Skip if content div not rendered
			if (this.contentDiv == undefined) return;
			// Check if content is already loaded or loading
			if (this.content != undefined) return;
			// Start load popup content loaded
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

		getMarkerExpanded() {
			if (!this.markerComponent) return false;
			return this.markerComponent.getExpanded();
		}

		getMarkerCollapsed() {
			if (!this.markerComponent) return false;
			return this.markerComponent.getCollapsed();
		}
	}

	let mapPopupsIntervalId: number | undefined;

	let mapPopupDataArray = $state(new Array<MapPopupData>());
	let mapPopupDataMap = $state(new Map<string, MapPopupData>());

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
			processPopupCircle(data, zoom, mapWindowBounds);
			// Process popup marker
			processPopupMarker(data, zoom, mapOffsetBounds);
		}
	}

	function processPopupCircle(data: MapPopupData, zoom: number, bounds: MapBoundsPair) {
		if (data.circleElement == undefined) return;

		// Check if circle is in bounds
		if (data.isInBlock(zoom + MAP_VISIBLE_ZOOM_DEPTH, bounds)) {
			// Check if circle exist on map
			if (data.circleLibreMarker == undefined) {
				// Create circle
				data.createCircleLibreMarker();
			}

			// Update circle map and state
			data.updateCircleMap(map);
			data.updateCircleState(zoom);
		} else {
			if (data.circleLibreMarker != undefined) {
				data.updateCircleMap(null);
			}
		}
	}

	function processPopupMarker(data: MapPopupData, zoom: number, bounds: MapBoundsPair) {
		if (data.markerElement == undefined) return;

		// Check if marker is in bounds
		if (data.isInBlock(zoom + MAP_DISPLAYED_ZOOM_DEPTH, bounds)) {
			// Check if marker exist on map
			if (data.markerLibreMarker == undefined) {
				// Create marker
				data.createMarkerLibreMarker();
			}

			// Update marker map and state
			data.updateMarkerMap(map);
			data.updateMarkerState(zoom);

			// If marker is expanded, update content
			if (data.getMarkerExpanded()) {
				data.updateMarkerContent();
			}
		} else {
			// Check if marker exist on map
			if (data.markerLibreMarker != undefined) {
				// Wait until marker is collapsed before removing it
				if (data.getMarkerCollapsed()) {
					data.updateMarkerMap(null);
				} else {
					data.updateMarkerState(zoom);
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
				oldData.circleLibreMarker?.remove();
				oldData.markerLibreMarker?.remove();

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
				oldData.zoom = newPopup.state[0];
				oldData.angles = newPopup.state[1];
				oldData.updateCircleZIndex();
				oldData.updateMarkerZIndex();
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
			data.circleLibreMarker?.remove();
			data.markerLibreMarker?.remove();
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

	//#endregion
</script>

<svelte:window onresize={() => map.setMinZoom(getViewportMinZoom(mapMinZoom))} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="container" style="--primary: {style.colors.primary}; --background: {style.colors.background}; --text: {style.colors.text};">
	<div class="map" bind:this={mapContainer} bind:clientWidth={mapWidth} bind:clientHeight={mapHeight}></div>
	<div class="logo"><a href="https://arenarium.dev" target="_blank">@arenarium/maps</a></div>
	<div class="markers">
		{#each mapPopupDataArray as data (data.id)}
			<div class="circle" bind:this={data.circleElement}>
				<MapMarkerCircle bind:this={data.circleComponent} />
			</div>
			<div class="marker" bind:this={data.markerElement}>
				<MapMarker bind:this={data.markerComponent}>
					<div class="popup" style="width: {data.width}px; height: {data.height}px;" bind:this={data.contentDiv}></div>
				</MapMarker>
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
