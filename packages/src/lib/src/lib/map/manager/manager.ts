import { mount } from 'svelte';

import MapTooltipComponent from '../../components/map/Tooltip.svelte';
import MapPinComponent from '../../components/map/Pin.svelte';

import { MapBounds } from './bounds.js';

import { log } from '../log.js';
import { animation, ANIMATION_PIN_LAYER, ANIMATION_TOOLTIP_LAYER } from '../animation/animation.js';
import {
	mapMarkersSchema,
	mapProviderSchema,
	type MapConfiguration,
	type MapMarker,
	type MapTooltipState,
	type MapTooltipStatesRequest,
	type MapProvider,
	type MapProviderMarker,
	type MapBodyCallback
} from '../schemas.js';

import { Angles } from '@workspace/shared/src/constants.js';

const API_URL = import.meta.env.VITE_API_URL;

class MapManager {
	private key: string;
	private provider: MapProvider;
	private apiUrl = API_URL;

	private markerDataArray = new Array<MapMarkerData>();
	private markerDataMap = new Map<string, MapMarkerData>();
	private markerDataUpdating = false;

	private markerPinProcessor: MapPinProcessor;
	private markerTooltipProcessor: MapTooltipProcessor;

	constructor(apiKey: string, mapProvider: MapProvider, mapConfiguration?: MapConfiguration) {
		mapProviderSchema.parse(mapProvider);

		this.key = apiKey;
		this.provider = mapProvider;

		this.markerPinProcessor = new MapPinProcessor(mapProvider);
		this.markerTooltipProcessor = new MapTooltipProcessor(mapProvider);

		this.configuration = mapConfiguration;
	}

	public set configuration(configuration: MapConfiguration | undefined) {
		this.apiUrl = configuration?.states?.api ?? API_URL;
		this.markerPinProcessor.setConfiguration(configuration);

		animation.setLimit(configuration?.animation?.queue?.limit ?? 8 * navigator.hardwareConcurrency);
	}

	public async updateMarkers(markers: MapMarker[]) {
		try {
			// Validate markers
			await mapMarkersSchema.parseAsync(markers);

			// Get marker tooltip states
			const tooltipStatesRequest: MapTooltipStatesRequest = {
				key: this.key,
				parameters: this.provider.parameters,
				input: markers.map((m) => ({
					id: m.id,
					rank: m.rank,
					lat: m.lat,
					lng: m.lng,
					width: m.tooltip.style.width,
					height: m.tooltip.style.height,
					margin: m.tooltip.style.margin
				}))
			};
			const tooltipStatesResponse = await fetch(this.apiUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(tooltipStatesRequest)
			});
			if (!tooltipStatesResponse.ok || !tooltipStatesResponse.body) {
				throw new Error('Failed to get marker states');
			}
			const tooltipStates: MapTooltipState[] = await tooltipStatesResponse.json();

			// Update data
			this.updateMarkerData(markers, tooltipStates);

			// Process marker data
			this.processMarkerDataCallback();
		} catch (error: any) {
			console.error(error);
			log('[Error] Failed to update markers', { message: error.message, stack: error.stack });

			throw error;
		}
	}

	public removeMarkers() {
		try {
			this.removeMarkerData();
		} catch (error: any) {
			console.error(error);
			log('[Error] Failed to remove markers', { message: error.message, stack: error.stack });

			throw error;
		}
	}

	private updateMarkerData(newMarkers: MapMarker[], newMarkerStates: MapTooltipState[]) {
		try {
			this.markerDataUpdating = true;

			// Remove old data
			const newMarkersMap = new Map(newMarkers.map((m, i) => [m.id, new MapMarkerData(this.provider, m, newMarkerStates[i])]));
			const oldMarkerDataArray = Array.from(this.markerDataArray);

			for (const oldMarkerData of oldMarkerDataArray) {
				if (newMarkersMap.has(oldMarkerData.id) == false) {
					oldMarkerData.remove();

					this.markerDataMap.delete(oldMarkerData.id);
					this.markerDataArray.splice(this.markerDataArray.indexOf(oldMarkerData), 1);
				}
			}

			// Crate or update new data
			for (let i = 0; i < newMarkers.length; i++) {
				const newMarker = newMarkers[i];
				const newMarkerState = newMarkerStates[i];

				// Check if data already exists
				const oldMarkerData = this.markerDataMap.get(newMarker.id);

				if (oldMarkerData) {
					// Update data
					oldMarkerData.update(newMarkerState);
				} else {
					// Create data
					const newData = new MapMarkerData(this.provider, newMarker, newMarkerState);
					newData.create();

					this.markerDataMap.set(newMarker.id, newData);
					this.markerDataArray.push(newData);
				}
			}

			// Sort elements by zoom
			this.markerDataArray.sort((a, b) => a.zoom - b.zoom);

			// Set elements
			this.markerPinProcessor.setElements(this.markerDataArray.map((m) => m.pin));
			this.markerTooltipProcessor.setElements(this.markerDataArray.map((m) => m.tooltip));
		} catch (error) {
			console.error(error);

			this.markerDataArray.forEach((data) => data.remove());
			this.markerDataArray.length = 0;
			this.markerDataMap.clear();

			throw error;
		} finally {
			this.markerDataUpdating = false;
		}
	}

	private removeMarkerData() {
		try {
			this.markerDataUpdating = true;

			this.markerDataArray.forEach((data) => data.remove());
			this.markerDataArray.length = 0;
			this.markerDataMap.clear();
		} catch (error) {
			console.error(error);
			throw error;
		} finally {
			this.markerDataUpdating = false;
		}
	}

	private processMarkerDataCallback() {
		// Check if map is loaded or marker data is empty
		if (this.markerDataArray.length == 0) return;

		try {
			this.processMarkerData();
			window.setTimeout(this.processMarkerDataCallback.bind(this), 25);
		} catch (error: any) {
			console.error(error);
			log('[Error] Failed to process markers', { message: error.message, stack: error.stack });
		}
	}

	private processMarkerData() {
		// Check if map marker data is updating
		if (this.markerDataUpdating) return;

		// Get map zoom
		const mapZoom = this.provider.getZoom();
		const mapWidth = this.provider.getWidth();
		const mapHeight = this.provider.getHeight();

		this.markerTooltipProcessor.process(mapWidth, mapHeight, mapZoom);
		this.markerPinProcessor.process(mapWidth, mapHeight, mapZoom);
	}
}

class MapMarkerData {
	id: string;
	rank: number;
	zoom: number;

	pin: MapPinElement;
	tooltip: MapTooltipElement;

	constructor(provider: MapProvider, marker: MapMarker, state: MapTooltipState) {
		this.id = marker.id;
		this.rank = marker.rank;
		this.zoom = state[0];

		this.pin = new MapPinElement(provider, marker, state);
		this.tooltip = new MapTooltipElement(provider, marker, state);
	}

	create() {
		this.pin.create();
		this.tooltip.create();
	}

	update(state: MapTooltipState) {
		this.pin.update(state);
		this.tooltip.update(state);
	}

	remove() {
		this.pin.remove();
		this.tooltip.remove();
	}
}

class MapElement<T> {
	provider: MapProvider;

	id: string;
	lat: number;
	lng: number;
	zoom: number;

	element: HTMLElement | undefined;
	component: T | undefined;
	marker: MapProviderMarker | undefined;

	constructor(provider: MapProvider, marker: MapMarker, state: MapTooltipState) {
		this.provider = provider;
		this.id = marker.id;
		this.lat = marker.lat;
		this.lng = marker.lng;
		this.zoom = state[0];
	}

	create() {
		this.createElement();
		this.createMarker();
		this.updateZIndex();
	}

	createElement() {
		throw new Error('Create element not implemented');
	}

	createMarker() {
		const element = this.element;
		if (!element) throw new Error('Failed to create provider marker');

		// Create new marker
		this.marker = this.provider.createMarker(element, this.lat, this.lng, this.getZindex());
	}

	update(state: MapTooltipState) {
		this.zoom = state[0];

		this.updateZIndex();
	}

	updateZIndex() {
		if (this.marker == undefined) throw new Error('Failed to update provider marker z-index');

		this.marker.update(this.getZindex());
	}

	updateMap(contains: boolean) {
		const marker = this.marker;
		const component = this.component;
		if (marker == undefined || component == undefined) throw new Error('Failed to update provider marker map');

		if (contains) {
			if (marker.inserted() == false) {
				marker.insert();
			}
		} else {
			if (marker.inserted() == true) {
				marker.remove();
			}
		}
	}

	getZindex() {
		return Math.round((this.provider.parameters.zoomMax - this.zoom) * this.provider.parameters.zoomScale);
	}

	remove() {
		this.marker?.remove();
		this.element?.remove();
	}
}

//#region Pin

class MapPinElement extends MapElement<ReturnType<typeof MapPinComponent>> {
	private static DEFAULT_SIZE = 14;

	width: number;
	height: number;
	radius: number;

	bodyLoading = false;
	bodyLoaded = false;
	bodyCallback: MapBodyCallback | undefined;

	constructor(provider: MapProvider, marker: MapMarker, state: MapTooltipState) {
		super(provider, marker, state);

		this.width = marker.pin?.style.width ?? MapPinElement.DEFAULT_SIZE;
		this.height = marker.pin?.style.height ?? MapPinElement.DEFAULT_SIZE;
		this.radius = marker.pin?.style.radius ?? MapPinElement.DEFAULT_SIZE / 2;
		this.bodyCallback = marker.pin?.body;
	}

	createElement() {
		this.element = document.createElement('div');
		this.element.classList.add('pin');
		this.component = mount(MapPinComponent, {
			target: this.element,
			props: {
				id: this.id + '_pin',
				layer: ANIMATION_PIN_LAYER,
				priority: this.zoom * this.provider.parameters.zoomScale,
				width: this.width,
				height: this.height,
				radius: this.radius
			}
		});
	}

	updateMap(contains: boolean) {
		super.updateMap(contains);

		this.component?.setDisplayed(contains);
	}

	updateState(zoom: number) {
		if (this.component == undefined) throw new Error('Failed to update pin state');
		this.component.setScale(this.getScale(zoom));
	}

	updateBody() {
		if (this.bodyCallback == undefined) return;
		if (this.bodyLoaded || this.bodyLoading) return;

		const pin = this.component?.getBody();
		if (pin == undefined) return;

		this.bodyLoading = true;
		this.bodyCallback(this.id).then((content) => {
			pin.appendChild(content);
			this.bodyLoaded = true;
			this.bodyLoading = false;
		});
	}

	setCollapsed(value: boolean) {
		if (this.component == undefined) throw new Error('Failed to set pin collapsed');
		this.component.setScale(value ? 0 : 1);
	}

	getScale(zoom: number) {
		if (this.zoom < zoom) return 1;
		else return Math.max(0, 1 - (this.zoom - zoom) * 0.125);
	}

	isCollapsed() {
		if (this.component == undefined) return false;
		return this.component.getCollapsed();
	}

	isBodyLoaded() {
		return this.bodyCallback == undefined || this.bodyLoaded;
	}
}

class MapPinProcessor {
	private static MAP_PINS_MAX_ZOOM = 2;
	private static MAP_PINS_MAX_COUNT = 128;

	private provider: MapProvider;

	// Data
	private pinElements = new Array<MapPinElement>();

	// Configuration
	private pinFade = false;
	private pinMaxCount = 0;
	private pinMaxZoomDelta = 0;

	constructor(mapProvider: MapProvider) {
		this.provider = mapProvider;
	}

	public setConfiguration(configuration: MapConfiguration | undefined) {
		this.pinFade = configuration?.pin?.fade ?? true;
		this.pinMaxCount = configuration?.pin?.maxCount ?? Math.max(MapPinProcessor.MAP_PINS_MAX_COUNT, 8 * navigator.hardwareConcurrency);
		this.pinMaxZoomDelta = configuration?.pin?.maxZoom ?? MapPinProcessor.MAP_PINS_MAX_ZOOM;
	}

	public setElements(elements: Array<MapPinElement>) {
		this.pinElements = elements;
	}

	public process(mapWidth: number, mapHeight: number, mapZoom: number) {
		const mapPinBounds = new MapBounds(0, mapHeight, mapWidth, 0, this.provider.parameters);

		// Track pin count
		let pinCount = 0;

		for (const pin of this.pinElements) {
			if (mapPinBounds.contains(pin.lat, pin.lng)) {
				if (mapZoom <= pin.zoom && pin.zoom <= mapZoom + this.pinMaxZoomDelta) {
					if (pinCount < this.pinMaxCount) {
						// Update pin state
						if (this.pinFade == true) {
							pin.updateState(mapZoom);
						} else {
							pin.setCollapsed(false);
						}

						// Update pin map
						pin.updateMap(true);

						// Update pin pin if not loaded
						if (pin.isBodyLoaded() == false) {
							pin.updateBody();
						}
					}

					pinCount++;
				} else {
					pin.setCollapsed(true);

					// Wait until pin is invisible before removing it
					if (pin.isCollapsed()) {
						pin.updateMap(false);
					}
				}
			} else {
				// If outside bounds immediately remove
				pin.updateMap(false);
			}
		}
	}
}

//#endregion

//#region Tooltip

class MapTooltipElement extends MapElement<ReturnType<typeof MapTooltipComponent>> {
	private static Z_INDEX_OFFSET = 1000000;

	width: number;
	height: number;
	margin: number;
	radius: number;
	states: [number, number][];

	bodyLoading = false;
	bodyLoaded = false;
	bodyCallback: MapBodyCallback;

	constructor(provider: MapProvider, marker: MapMarker, state: MapTooltipState) {
		super(provider, marker, state);

		this.id = marker.id;
		this.width = marker.tooltip.style.width;
		this.height = marker.tooltip.style.height;
		this.margin = marker.tooltip.style.margin;
		this.radius = marker.tooltip.style.radius;
		this.states = state[1].map((s) => [s[0], Angles.DEGREES[s[1]]]);

		this.bodyCallback = marker.tooltip.body;
	}

	createElement() {
		this.element = document.createElement('div');
		this.element.classList.add('tooltip');
		this.component = mount(MapTooltipComponent, {
			target: this.element,
			props: {
				id: this.id + '_tooltip',
				layer: ANIMATION_TOOLTIP_LAYER,
				priority: this.zoom * this.provider.parameters.zoomScale,
				width: this.width,
				height: this.height,
				margin: this.margin,
				radius: this.radius
			}
		});
	}

	update(state: MapTooltipState) {
		super.update(state);
		this.states = state[1].map((s) => [s[0], Angles.DEGREES[s[1]]]);
	}

	updateMap(contains: boolean) {
		super.updateMap(contains);

		this.component?.setDisplayed(contains);
	}

	updateState(zoom: number) {
		if (this.component == undefined) throw new Error('Failed to update tooltip state');
		this.component.setAngle(this.getAngle(zoom));
	}

	updateBody() {
		// Check if content is already loaded or loading
		if (this.bodyLoaded || this.bodyLoading) return;

		// Check if content div rendered
		const body = this.component?.getBody();
		if (body == undefined) return;

		// Load body callback
		this.bodyLoading = true;
		this.bodyCallback(this.id).then((content: any) => {
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

	getZindex(): number {
		return super.getZindex() + MapTooltipElement.Z_INDEX_OFFSET;
	}

	setCollapsed(value: boolean) {
		if (this.component == undefined) throw new Error('Failed to set tooltip collapsed');
		this.component.setCollapsed(value);
	}

	isExpanded() {
		if (this.component == undefined) return false;
		return this.component.getExpanded();
	}

	isCollapsed() {
		if (this.component == undefined) return false;
		return this.component.getCollapsed();
	}

	isBodyLoaded() {
		return this.bodyLoaded;
	}
}

class MapTooltipProcessor {
	private provider: MapProvider;

	// Data
	private tooltipElements = new Array<MapTooltipElement>();

	// Configuration
	private tooltipMaxWidth = 0;
	private tooltipMaxHeight = 0;

	constructor(mapProvider: MapProvider) {
		this.provider = mapProvider;
	}

	public setElements(elements: Array<MapTooltipElement>) {
		this.tooltipElements = elements;
		this.tooltipMaxWidth = this.tooltipElements.reduce((a, b) => Math.max(a, b.width), 0);
		this.tooltipMaxHeight = this.tooltipElements.reduce((a, b) => Math.max(a, b.height), 0);
	}

	public process(mapWidth: number, mapHeight: number, mapZoom: number) {
		const mapOffsetX = this.tooltipMaxWidth * 2;
		const mapOffsetY = this.tooltipMaxHeight * 2;
		const mapTooltipBounds = new MapBounds(-mapOffsetX, mapHeight + mapOffsetY, mapWidth + mapOffsetX, -mapOffsetY, this.provider.parameters);

		for (const tooltip of this.tooltipElements) {
			if (mapTooltipBounds.contains(tooltip.lat, tooltip.lng)) {
				if (tooltip.zoom <= mapZoom) {
					// Update marker state
					tooltip.updateState(mapZoom);
					tooltip.setCollapsed(false);

					// Update marker map
					tooltip.updateMap(true);

					// If marker is expanded, update body if not loaded
					if (tooltip.isExpanded() && tooltip.isBodyLoaded() == false) {
						tooltip.updateBody();
					}
				} else {
					// Check if marker exist on map
					tooltip.setCollapsed(true);

					// Wait until marker is collapsed before removing it
					if (tooltip.isCollapsed()) {
						tooltip.updateMap(false);
					}
				}
			} else {
				// If outside bounds immediately remove
				tooltip.updateMap(false);
			}
		}
	}
}

//#endregion

export { MapManager };
