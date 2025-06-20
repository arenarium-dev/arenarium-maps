import { mount } from 'svelte';

import MapTooltipComponent from '../components/map/Tooltip.svelte';
import MapPinComponent from '../components/map/Pin.svelte';

import { log } from './log.js';
import { animation, ANIMATION_PIN_LAYER, ANIMATION_TOOLTIP_LAYER } from './animation/animation.js';
import {
	mapMarkersSchema,
	mapProviderSchema,
	type MapConfiguration,
	type MapMarker,
	type MapBodyCallback,
	type MapTooltipState,
	type MapTooltipStatesRequest,
	type MapProvider,
	type MapProviderMarker,
	type MapProviderParameters
} from './schemas.js';

import { Mercator } from '@workspace/shared/src/tooltip/mercator.js';
import { Angles } from '@workspace/shared/src/constants.js';

const MAP_PINS_MAX_ZOOM = 2;
const MAP_PINS_MAX_COUNT = 128;
const MAP_TOOLTIPS_Z_INDEX_OFFSET = 1000000;

const API_URL = import.meta.env.VITE_API_URL;

class MapManager {
	private key: string;
	private provider: MapProvider;

	private markerDataArray = new Array<MapMarkerData>();
	private markerDataMap = new Map<string, MapMarkerData>();
	private markerDataUpdating = false;

	private tooltipMaxWidth = 0;
	private tooltipMaxHeight = 0;

	private configurationPinFade = false;
	private configurationPinMaxCount = 0;
	private configurationPinMaxZoomDelta = 0;
	private configurationApiUrl = API_URL;

	constructor(apiKey: string, mapProvider: MapProvider, mapConfiguration?: MapConfiguration) {
		mapProviderSchema.parse(mapProvider);

		this.key = apiKey;
		this.provider = mapProvider;
		this.configuration = mapConfiguration;
	}

	public set configuration(configuration: MapConfiguration | undefined) {
		this.configurationPinFade = configuration?.pin?.fade ?? true;
		this.configurationPinMaxCount = configuration?.pin?.maxCount ?? Math.max(MAP_PINS_MAX_COUNT, 8 * navigator.hardwareConcurrency);
		this.configurationPinMaxZoomDelta = configuration?.pin?.maxZoom ?? MAP_PINS_MAX_ZOOM;
		this.configurationApiUrl = configuration?.states?.api ?? API_URL;

		animation.setLimit(configuration?.animation?.queue?.limit ?? 8 * navigator.hardwareConcurrency);
	}

	public async updateMarkers(markers: MapMarker[]) {
		try {
			// Validate markers
			await mapMarkersSchema.parseAsync(markers);

			// Get marker states
			const markerStatesRequest: MapTooltipStatesRequest = {
				key: this.key,
				parameters: this.provider.parameters,
				input: markers.map((m) => ({
					id: m.id,
					rank: m.rank,
					lat: m.lat,
					lng: m.lng,
					width: m.tooltip.data.width,
					height: m.tooltip.data.height,
					margin: m.tooltip.data.margin
				}))
			};
			const markerStatesResponse = await fetch(this.configurationApiUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(markerStatesRequest)
			});
			if (!markerStatesResponse.ok || !markerStatesResponse.body) {
				throw new Error('Failed to get marker states');
			}
			const states: MapTooltipState[] = await markerStatesResponse.json();

			// Update data
			this.updateMarkerData(markers, states);

			// Update max width and height
			this.tooltipMaxWidth = this.markerDataArray.reduce((a, b) => Math.max(a, b.tooltip.width), 0);
			this.tooltipMaxHeight = this.markerDataArray.reduce((a, b) => Math.max(a, b.tooltip.height), 0);

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
		const zoom = this.provider.getZoom();
		if (!zoom) return;

		// Get bounds
		const mapWidth = this.provider.getWidth();
		const mapHeight = this.provider.getHeight();
		const mapOffsetX = this.tooltipMaxWidth * 2;
		const mapOffsetY = this.tooltipMaxHeight * 2;
		const mapOffsetBounds = new MapBounds(-mapOffsetX, mapHeight + mapOffsetY, mapWidth + mapOffsetX, -mapOffsetY, this.provider.parameters);
		const mapWindowBounds = new MapBounds(0, mapHeight, mapWidth, 0, this.provider.parameters);

		// Track pin count
		let pinCount = 0;

		for (const data of this.markerDataArray) {
			const zoomThreshold = data.supressed ? -1 : zoom;

			// Process marker pin
			const pin = data.pin;

			if (mapWindowBounds.contains(pin.lat, pin.lng)) {
				if (zoomThreshold <= pin.zoom && pin.zoom <= zoom + this.configurationPinMaxZoomDelta) {
					if (pinCount < this.configurationPinMaxCount) {
						// Update pin state
						if (this.configurationPinFade == true) {
							pin.updateState(zoom);
						} else {
							pin.setExpanded();
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
					pin.setCollapsed();

					// Wait until pin is invisible before removing it
					if (pin.isCollapsed()) {
						pin.updateMap(false);
					}
				}
			} else {
				// If outside bounds immediately remove
				pin.updateMap(false);
			}

			// Process marker marker
			const marker = data.tooltip;

			if (mapOffsetBounds.contains(marker.lat, marker.lng)) {
				if (marker.zoom <= zoomThreshold) {
					// Update marker state
					marker.updateState(zoom);
					marker.setCollapsed(false);

					// Update marker map
					marker.updateMap(true);

					// If marker is expanded, update body if not loaded
					if (marker.isExpanded() && marker.isBodyLoaded() == false) {
						marker.updateBody();
					}
				} else {
					// Check if marker exist on map
					marker.setCollapsed(true);

					// Wait until marker is collapsed before removing it
					if (marker.isCollapsed()) {
						marker.updateMap(false);
					}
				}
			} else {
				// If outside bounds immediately remove
				marker.updateMap(false);
			}
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
				const oldData = this.markerDataMap.get(newMarker.id);

				if (oldData) {
					// Update data
					oldData.update(newMarkerState);
				} else {
					// Create data
					const newData = new MapMarkerData(this.provider, newMarker, newMarkerState);
					newData.create();

					this.markerDataMap.set(newMarker.id, newData);
					this.markerDataArray.push(newData);
				}
			}

			this.markerDataArray.sort((a, b) => a.zoom - b.zoom);
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
		if (!element) throw new Error('Failed to create marker');

		// Create new marker
		this.marker = this.provider.createMarker(element, this.lat, this.lng, this.getZindex());
	}

	update(state: MapTooltipState) {
		this.zoom = state[0];

		this.updateZIndex();
	}

	updateZIndex() {
		if (this.marker == undefined) throw new Error('Failed to update marker z-index');

		this.marker.update(this.getZindex());
	}

	updateMap(contains: boolean) {
		const marker = this.marker;
		const component = this.component;
		if (marker == undefined || component == undefined) throw new Error('Failed to update marker map');

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

	isInBlock(zoom: number, bounds: MapBounds) {
		return this.zoom <= zoom && bounds.contains(this.lat, this.lng);
	}

	remove() {
		this.marker?.remove();
		this.element?.remove();
	}
}

class MapPinElement extends MapElement<ReturnType<typeof MapPinComponent>> {
	bodyLoading = false;
	bodyLoaded = false;
	bodyCallback: MapBodyCallback | undefined;

	constructor(provider: MapProvider, marker: MapMarker, state: MapTooltipState) {
		super(provider, marker, state);

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
				priority: this.zoom * this.provider.parameters.zoomScale
			}
		});
	}

	updateMap(contains: boolean) {
		super.updateMap(contains);

		this.component?.setDisplayed(contains);
	}

	updateState(zoom: number) {
		const pin = this.component;
		if (!pin) throw new Error('Failed to update pin state');

		// Set pin scale
		pin.setScale(this.getScale(zoom));
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

	setExpanded() {
		if (this.component == undefined) throw new Error('Failed to set pin expanded');
		this.component.setScale(1);
	}

	setCollapsed() {
		if (this.component == undefined) throw new Error('Failed to set pin collapsed');
		this.component.setScale(0);
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

class MapTooltipElement extends MapElement<ReturnType<typeof MapTooltipComponent>> {
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
		this.width = marker.tooltip.data.width;
		this.height = marker.tooltip.data.height;
		this.margin = marker.tooltip.data.margin;
		this.radius = marker.tooltip.data.radius;
		this.states = state[1].map((s) => [s[0], Angles.DEGREES[s[1]]]);

		this.bodyCallback = marker.tooltip.body;
	}

	createElement() {
		this.element = document.createElement('div');
		this.element.classList.add('marker');
		this.component = mount(MapTooltipComponent, {
			target: this.element,
			props: {
				id: this.id + '_marker',
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
		const marker = this.component;
		if (!marker) throw new Error('Failed to update marker state');

		// Set marker angle
		marker.setAngle(this.getAngle(zoom));
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
		return super.getZindex() + MAP_TOOLTIPS_Z_INDEX_OFFSET;
	}

	setCollapsed(value: boolean) {
		if (this.component == undefined) throw new Error('Failed to set marker collapsed');
		this.component.setCollapsed(value);
	}

	isExpanded() {
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

class MapMarkerData {
	id: string;
	rank: number;
	lat: number;
	lng: number;
	zoom: number;
	supressed: boolean;

	pin: MapPinElement;
	tooltip: MapTooltipElement;

	constructor(provider: MapProvider, marker: MapMarker, state: MapTooltipState) {
		this.id = marker.id;
		this.rank = marker.rank;
		this.lat = marker.lat;
		this.lng = marker.lng;
		this.zoom = state[0];
		this.supressed = false;

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

class MapBounds {
	swLat: number;
	swLng: number;
	neLat: number;
	neLng: number;

	constructor(swX: number, swY: number, neX: number, neY: number, parameters: MapProviderParameters) {
		const sw = Mercator.unproject(swX, swY, parameters.mapSize);
		const ne = Mercator.unproject(neX, neY, parameters.mapSize);
		this.swLat = sw.lat;
		this.swLng = sw.lng;
		this.neLat = ne.lat;
		this.neLng = ne.lng;
	}

	public contains = (lat: number, lng: number) => {
		if (this.swLat <= lat && lat <= this.neLat) {
			if (this.swLng < this.neLng) {
				return this.swLng <= lng && lng <= this.neLng;
			} else {
				return lng <= this.neLng || this.swLng <= lng;
			}
		} else {
			return false;
		}
	};
}

export { MapManager };
