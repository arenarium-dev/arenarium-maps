import { mount } from 'svelte';

import MapPinComponent from '$lib/components/Pin.svelte';
import MapTooltipComponent from '$lib/components/Tooltip.svelte';

import { MapViewport } from '$lib/map/manager/viewport.js';
import { getStates } from '$lib/map/manager/compute/states.js';
import { animation, ANIMATION_PIN_LAYER, ANIMATION_PRIORITY_LAYER, ANIMATION_TOOLTIP_LAYER } from '$lib/map/animation/animation.js';
import { Angles } from '$lib/map/constants.js';
import {
	mapMarkersSchema,
	mapProviderSchema,
	type MapConfiguration,
	type MapMarker,
	type MapTooltipState,
	type MapTooltipStatesRequest,
	type MapProvider,
	type MapProviderMarker,
	type MapBodyCallback,
	type MapBounds,
	type Log
} from '$lib/map/schemas.js';

class MapManager {
	private provider: MapProvider;

	private apiStatesUrl: string | undefined;
	private apiStatesKey: string | undefined;
	private apiLogEnabled: boolean = true;

	private markerDataArray = new Array<MapMarkerData>();
	private markerDataMap = new Map<string, MapMarkerData>();
	private markerDataUpdating = false;

	private markerPinProcessor: MapPinProcessor;
	private markerTooltipProcessor: MapTooltipProcessor;
	private markerPopupProcessor: MapPopupProcessor;

	constructor(mapProvider: MapProvider, mapConfiguration?: MapConfiguration) {
		mapProviderSchema.parse(mapProvider);

		this.provider = mapProvider;

		this.markerPinProcessor = new MapPinProcessor(mapProvider);
		this.markerTooltipProcessor = new MapTooltipProcessor(mapProvider);
		this.markerPopupProcessor = new MapPopupProcessor(mapProvider);

		this.configuration = mapConfiguration;

		this.log('[CLIENT] Map manager created');
	}

	public set configuration(configuration: MapConfiguration | undefined) {
		this.apiStatesUrl = configuration?.api?.states?.url;
		this.apiStatesKey = configuration?.api?.states?.key;
		this.apiLogEnabled = configuration?.api?.log?.enabled ?? true;

		this.markerPinProcessor.setConfiguration(configuration);

		animation.setLimit(configuration?.animation?.queue?.limit ?? 8 * navigator.hardwareConcurrency);
	}

	public async updateMarkers(markers: MapMarker[]) {
		// Validate markers
		await mapMarkersSchema.parseAsync(markers);

		try {
			let tooltipStates: MapTooltipState[];

			// If there are more than one marker, get states from api or calculate
			if (markers.length > 1) {
				const tooltipStatesInput = markers.map((m) => ({
					id: m.id,
					rank: m.rank,
					lat: m.lat,
					lng: m.lng,
					width: m.tooltip.style.width,
					height: m.tooltip.style.height,
					margin: m.tooltip.style.margin
				}));

				// If states api is configured, get states from api
				if (this.apiStatesUrl != undefined && this.apiStatesKey != undefined) {
					const tooltipStatesRequest: MapTooltipStatesRequest = {
						key: this.apiStatesKey,
						parameters: this.provider.parameters,
						input: tooltipStatesInput
					};
					const tooltipStatesResponse = await fetch(this.apiStatesUrl, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(tooltipStatesRequest)
					});
					if (!tooltipStatesResponse.ok || !tooltipStatesResponse.body) {
						throw new Error('Failed to get marker states: ' + tooltipStatesResponse.statusText);
					}

					tooltipStates = await tooltipStatesResponse.json();
				}
				// Else, calculate states
				else {
					tooltipStates = getStates(this.provider.parameters, tooltipStatesInput);
				}
			}
			// If there is only one marker, use default tooltip state
			else {
				tooltipStates = [[0, [[0, Angles.DEGREES.indexOf(Angles.DEFAULT)]]]];
			}

			// Update marker data
			this.updateMarkerData(markers, tooltipStates);

			// Process marker data
			this.processMarkerDataCallback();
		} catch (error) {
			console.error(error);

			this.removeMarkerData();

			if (error instanceof Error) {
				this.log('[CLIENT] Failed to update markers', { message: error.message, stack: error.stack });
			}

			throw error;
		}
	}

	public removeMarkers() {
		try {
			this.removeMarkerData();
		} catch (error) {
			console.error(error);

			if (error instanceof Error) {
				this.log('[CLIENT] Failed to remove markers', { message: error.message, stack: error.stack });
			}

			throw error;
		}
	}

	public showPopup(id: string) {
		try {
			for (const data of this.markerDataArray) {
				if (data.marker.id == id) {
					this.markerPopupProcessor.show(data);
				} else {
					this.markerPopupProcessor.hide(data);
				}
			}
		} catch (error) {
			console.error(error);

			for (const marker of this.markerDataArray) {
				this.markerPopupProcessor.hide(marker);
			}

			if (error instanceof Error) {
				this.log('[CLIENT] Failed to show popup', { message: error.message, stack: error.stack });
			}

			throw error;
		}
	}

	public hidePopup(id?: string) {
		try {
			if (id) {
				const data = this.markerDataMap.get(id);
				if (data == undefined) return;

				this.markerPopupProcessor.hide(data);
			} else {
				for (const data of this.markerDataArray) {
					this.markerPopupProcessor.hide(data);
				}
			}
		} catch (error) {
			console.error(error);

			for (const marker of this.markerDataArray) {
				this.markerPopupProcessor.hide(marker);
			}

			if (error instanceof Error) {
				this.log('[CLIENT] Failed to hide popup', { message: error.message, stack: error.stack });
			}

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
				if (newMarkersMap.has(oldMarkerData.marker.id) == false) {
					oldMarkerData.remove();

					this.markerDataMap.delete(oldMarkerData.marker.id);
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
			this.markerPinProcessor.updateElements(this.markerDataArray.map((m) => m.pin));
			this.markerTooltipProcessor.updateElements(this.markerDataArray.map((m) => m.tooltip));
		} catch (error) {
			console.error(error);

			this.markerDataArray.forEach((data) => data.remove());
			this.markerDataArray.length = 0;
			this.markerDataMap.clear();

			if (error instanceof Error) {
				this.log('[CLIENT] Failed to update marker data', { message: error.message, stack: error.stack });
			}

			throw error;
		} finally {
			this.markerDataUpdating = false;
		}
	}

	private removeMarkerData() {
		try {
			this.markerDataUpdating = true;

			this.markerPinProcessor.removeElements();
			this.markerTooltipProcessor.removeElements();
			this.markerPopupProcessor.clear();

			this.markerDataArray.length = 0;
			this.markerDataMap.clear();
		} catch (error) {
			console.error(error);

			if (error instanceof Error) {
				this.log('[CLIENT] Failed to remove marker data', { message: error.message, stack: error.stack });
			}

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
		} catch (error) {
			console.error(error);

			if (error instanceof Error) {
				this.log('[CLIENT] Failed to process marker data', { message: error.message, stack: error.stack });
			}
		}
	}

	private processMarkerData() {
		// Check if map marker data is updating
		if (this.markerDataUpdating) return;

		// Get map zoom
		const mapBounds = this.provider.getBounds();
		const mapZoom = this.provider.getZoom();

		this.markerPopupProcessor.process();
		this.markerTooltipProcessor.process(mapBounds, mapZoom);
		this.markerPinProcessor.process(mapBounds, mapZoom);
	}

	private async log(title: string, content?: any) {
		if (this.apiLogEnabled == false || import.meta.env.DEV == true) return;

		try {
			const log: Log = {
				title,
				content
			};

			await fetch('https://arenarium.dev/api/public/v1/log', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(log)
			});
		} catch (error) {
			console.error(error);
		}
	}
}

class MapMarkerData {
	marker: MapMarker;
	zoom: number;

	pin: MapPinElement;
	tooltip: MapTooltipElement;

	constructor(provider: MapProvider, marker: MapMarker, state: MapTooltipState) {
		this.marker = marker;
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
	shown: boolean;

	element: HTMLElement | undefined;
	component: T | undefined;
	marker: MapProviderMarker | undefined;

	constructor(provider: MapProvider, marker: MapMarker) {
		this.provider = provider;
		this.id = marker.id;
		this.lat = marker.lat;
		this.lng = marker.lng;
		this.shown = true;
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

	getZindex(): number {
		throw new Error('Get z-index not implemented');
	}

	remove() {
		this.marker?.remove();
		this.element?.remove();
	}
}

//#region Pin

class MapPinElement extends MapElement<ReturnType<typeof MapPinComponent>> {
	private static DEFAULT_SIZE = 16;

	width: number;
	height: number;
	radius: number;

	zoom: number;

	bodyLoading = false;
	bodyLoaded = false;
	bodyCallback: MapBodyCallback | undefined;

	constructor(provider: MapProvider, marker: MapMarker, state: MapTooltipState) {
		super(provider, marker);

		this.width = marker.pin?.style.width ?? MapPinElement.DEFAULT_SIZE;
		this.height = marker.pin?.style.height ?? MapPinElement.DEFAULT_SIZE;
		this.radius = marker.pin?.style.radius ?? MapPinElement.DEFAULT_SIZE;
		this.zoom = state[0];
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

	update(state: MapTooltipState) {
		this.zoom = state[0];

		this.updateZIndex();
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

		const body = this.component?.getBody();
		if (body == undefined) return;

		this.bodyLoading = true;
		this.bodyCallback(this.id)
			.then((content) => body.appendChild(content))
			.catch((error) => console.error(error))
			.finally(() => {
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

	getZindex(): number {
		return Math.round((this.provider.parameters.zoomMax - this.zoom) * this.provider.parameters.zoomScale);
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
	private pinMaxWidth = 0;
	private pinMaxHeight = 0;
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

	public updateElements(elements: Array<MapPinElement>) {
		this.pinElements = elements;

		this.pinMaxWidth = elements.reduce((a, b) => Math.max(a, b.width), 0);
		this.pinMaxHeight = elements.reduce((a, b) => Math.max(a, b.height), 0);
	}

	public removeElements() {
		this.pinElements.forEach((pin) => pin.remove());
		this.pinElements.length = 0;
	}

	public process(mapBounds: MapBounds, mapZoom: number) {
		const mapSize = this.provider.parameters.mapSize;
		const mapViewport = new MapViewport(mapBounds, mapZoom, mapSize, this.pinMaxWidth * 2, this.pinMaxHeight * 2);

		// Track pin count
		let pinCount = 0;

		for (const pin of this.pinElements) {
			if (mapViewport.contains(pin.lat, pin.lng)) {
				if (pin.shown && mapZoom <= pin.zoom && pin.zoom <= mapZoom + this.pinMaxZoomDelta) {
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

	zoom: number;
	angle: number;
	states: [number, number][];

	bodyLoading = false;
	bodyLoaded = false;
	bodyCallback: MapBodyCallback;

	constructor(provider: MapProvider, marker: MapMarker, state: MapTooltipState) {
		super(provider, marker);

		this.width = marker.tooltip.style.width;
		this.height = marker.tooltip.style.height;
		this.margin = marker.tooltip.style.margin;
		this.radius = marker.tooltip.style.radius;

		this.zoom = state[0];
		this.angle = Angles.DEFAULT;
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
		this.zoom = state[0];
		this.states = state[1].map((s) => [s[0], Angles.DEGREES[s[1]]]);

		this.updateZIndex();
	}

	updateMap(contains: boolean) {
		super.updateMap(contains);

		this.component?.setDisplayed(contains);
	}

	updateState(zoom: number) {
		if (this.component == undefined) throw new Error('Failed to update tooltip state');

		this.angle = this.getAngle(zoom);
		this.component.setAngle(this.angle);
	}

	updateBody() {
		// Check if content is already loaded or loading
		if (this.bodyLoaded || this.bodyLoading) return;

		// Check if content div rendered
		const body = this.component?.getBody();
		if (body == undefined) return;

		// Load body callback
		this.bodyLoading = true;
		this.bodyCallback(this.id)
			.then((content) => body.appendChild(content))
			.catch((error) => console.error(error))
			.finally(() => {
				this.bodyLoaded = true;
				this.bodyLoading = false;
			});
	}

	getAngle(zoom: number) {
		const state = this.states.findLast((s) => s[0] <= zoom);
		if (!state) throw new Error('Angle not found');
		return state[1];
	}

	getZindex(): number {
		const zIndex = Math.round((this.provider.parameters.zoomMax - this.zoom) * this.provider.parameters.zoomScale);
		return zIndex + MapTooltipElement.Z_INDEX_OFFSET;
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

	public updateElements(elements: Array<MapTooltipElement>) {
		this.tooltipElements = elements;
		this.tooltipMaxWidth = this.tooltipElements.reduce((a, b) => Math.max(a, b.width), 0);
		this.tooltipMaxHeight = this.tooltipElements.reduce((a, b) => Math.max(a, b.height), 0);
	}

	public removeElements() {
		this.tooltipElements.forEach((tooltip) => tooltip.remove());
		this.tooltipElements.length = 0;
	}

	public process(mapBounds: MapBounds, mapZoom: number) {
		const mapSize = this.provider.parameters.mapSize;
		const mapViewport = new MapViewport(mapBounds, mapZoom, mapSize, this.tooltipMaxWidth * 2, this.tooltipMaxHeight * 2);

		for (const tooltip of this.tooltipElements) {
			if (mapViewport.contains(tooltip.lat, tooltip.lng)) {
				if (tooltip.shown && tooltip.zoom <= mapZoom) {
					// Update marker state
					tooltip.updateState(mapZoom);
					tooltip.setCollapsed(false);

					// Update marker map
					tooltip.updateMap(true);

					// If marker is expanded, update body if not loaded
					if (tooltip.isCollapsed() == false && tooltip.isBodyLoaded() == false) {
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

//#region Popup

class MapPopupElement extends MapElement<ReturnType<typeof MapTooltipComponent>> {
	private static Z_INDEX_OFFSET = 2000000;

	width: number;
	height: number;
	margin: number;
	radius: number;

	bodyLoading = false;
	bodyLoaded = false;
	bodyCallback: MapBodyCallback;

	constructor(provider: MapProvider, marker: MapMarker) {
		if (marker.popup == undefined) throw new Error('Failed to create popup');

		super(provider, marker);

		this.shown = false;
		this.width = marker.popup.style.width;
		this.height = marker.popup.style.height;
		this.margin = marker.popup.style.margin;
		this.radius = marker.popup.style.radius;

		this.bodyCallback = marker.popup.body;
	}

	createElement() {
		this.element = document.createElement('div');
		this.element.classList.add('popup');
		this.component = mount(MapTooltipComponent, {
			target: this.element,
			props: {
				id: this.id + '_popup',
				layer: ANIMATION_PRIORITY_LAYER,
				priority: 0,
				width: this.width,
				height: this.height,
				margin: this.margin,
				radius: this.radius
			}
		});
	}

	updateMap(contains: boolean) {
		super.updateMap(contains);

		this.component?.setDisplayed(contains);
	}

	updateBody() {
		// Check if content is already loaded or loading
		if (this.bodyLoaded || this.bodyLoading) return;

		// Check if content div rendered
		const body = this.component?.getBody();
		if (body == undefined) return;

		// Load body callback
		this.bodyLoading = true;
		this.bodyCallback(this.id)
			.then((content) => body.appendChild(content))
			.catch((error) => console.error(error))
			.finally(() => {
				this.bodyLoaded = true;
				this.bodyLoading = false;
			});
	}

	getZindex(): number {
		return MapPopupElement.Z_INDEX_OFFSET;
	}

	setCollapsed(value: boolean) {
		if (this.component == undefined) throw new Error('Failed to set popup collapsed');
		this.component.setCollapsed(value);
	}

	setAngle(value: number) {
		if (this.component == undefined) throw new Error('Failed to set popup angle');
		this.component.setAngle(value);
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

class MapPopupProcessor {
	private provider: MapProvider;

	// Data
	private popupElements = new Map<string, MapPopupElement>();
	private popupPositioned = new Map<string, boolean>();

	constructor(provider: MapProvider) {
		this.provider = provider;
	}

	public show(data: MapMarkerData) {
		// Hide pin and tooltip
		data.pin.shown = false;
		data.tooltip.shown = false;

		// Create popup
		const popup = new MapPopupElement(this.provider, data.marker);
		this.popupElements.set(data.marker.id, popup);
		this.popupPositioned.set(data.marker.id, false);

		popup.create();
		popup.setAngle(data.tooltip.angle);
		popup.shown = true;
	}

	public hide(data: MapMarkerData) {
		data.pin.shown = true;
		data.tooltip.shown = true;

		const popup = this.popupElements.get(data.marker.id);
		if (popup == undefined) return;

		popup.shown = false;
	}

	public clear() {
		this.popupElements.values().forEach((popup) => popup.remove());
		this.popupElements.clear();
		this.popupPositioned.clear();
	}

	public process() {
		for (const popup of this.popupElements.values()) {
			if (popup.shown) {
				// Update popup state
				popup.setCollapsed(false);

				// Update popup map
				popup.updateMap(true);

				// If popup is expanded, update body if not loaded
				if (popup.isExpanded() && popup.isBodyLoaded() == false) {
					popup.updateBody();
				}

				// Adjust map position to fit popup while its expanding
				if (popup.isCollapsed() == false && this.popupPositioned.get(popup.id) == false) {
					// Wait until popup body is loaded
					const popupBody = popup.component?.getBody() as HTMLElement;
					if (popupBody == undefined) continue;

					// Wait until popup offsets are calculated
					const popupOffsets = popup.component?.getOffsets() as { offsetX: number; offsetY: number };
					if (popupOffsets == undefined) continue;

					// Wait until popup rect is calculated
					const popupRect = popupBody.getBoundingClientRect();
					if (popupRect.x == 0 && popupRect.y == 0 && popupRect.width == 0 && popupRect.height == 0) continue;

					// Aproximate popup center
					const popupCenterX = popupRect.x + popupRect.width / 2;
					const popupCenterY = popupRect.y + popupRect.height / 2;

					// Calculate popup rect based on popup center, offsets and size
					const popupLeft = popupCenterX + popupOffsets.offsetX;
					const popupTop = popupCenterY + popupOffsets.offsetY;
					const popupRight = popupLeft + popup.width;
					const popupBottom = popupTop + popup.height;

					// Calculate distaces to map rect
					const mapRect = this.provider.getContainer().getBoundingClientRect();

					const distLeft = popupLeft - mapRect.left;
					const distRight = mapRect.right - popupRight;
					const distTop = popupTop - mapRect.top;
					const distBottom = mapRect.bottom - popupBottom;

					// Calculate pan to fit popup
					const panPadding = Math.min(popup.width, popup.height) / 4;
					const panX = distLeft < 0 ? distLeft - panPadding : distRight < 0 ? -distRight + panPadding : 0;
					const panY = distTop < 0 ? distTop - panPadding : distBottom < 0 ? -distBottom + panPadding : 0;

					this.provider.panBy(panX, panY);
					this.popupPositioned.set(popup.id, true);
				}
			} else {
				// Check if popup exist on map
				popup.setCollapsed(true);

				// Wait until popup is collapsed before removing it
				if (popup.isCollapsed()) {
					popup.updateMap(false);
					popup.remove();

					// Remove popup
					this.popupElements.delete(popup.id);
					this.popupPositioned.delete(popup.id);
				}
			}
		}
	}
}

//#endregion

export { MapManager };
