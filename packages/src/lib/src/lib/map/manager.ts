import { mount } from 'svelte';

import MapMarker from '../components/marker/Marker.svelte';
import MapMarkerCircle from '../components/marker/Circle.svelte';

import { log } from './log.js';
import { animation } from './animation/animation.js';
import {
	mapPopupsSchema,
	mapProviderSchema,
	type MapConfiguration,
	type MapPopup,
	type MapPopupContentCallback,
	type MapProvider,
	type MapProviderMarker,
	type MapProviderParameters
} from './schemas.js';

import { Mercator } from '@workspace/shared/src/popup/mercator.js';
import { Angles } from '@workspace/shared/src/constants.js';

const MAP_MARKERS_Z_INDEX_OFFSET = 1000000;
const MAP_CIRCLES_MAX_ZOOM = 2;
const MAP_CIRCLES_MAX_COUNT = 128;

class MapManager {
	private provider: MapProvider;

	private popupDataArray = new Array<MapPopupData>();
	private popupDataMap = new Map<string, MapPopupData>();
	private popupDataUpdating = false;

	private popupMaxWidth = 0;
	private popupMaxHeight = 0;

	private configurationPinFade = false;
	private configurationPinMaxCount = 0;
	private configurationPinMaxZoomDelta = 0;

	constructor(mapProvider: MapProvider, mapConfiguration?: MapConfiguration) {
		mapProviderSchema.parse(mapProvider);

		this.provider = mapProvider;
		this.configuration = mapConfiguration;
	}

	public set configuration(configuration: MapConfiguration | undefined) {
		this.configurationPinFade = configuration?.pin?.fade ?? true;
		this.configurationPinMaxCount = configuration?.pin?.maxCount ?? Math.max(MAP_CIRCLES_MAX_COUNT, 8 * navigator.hardwareConcurrency);
		this.configurationPinMaxZoomDelta = configuration?.pin?.maxZoom ?? MAP_CIRCLES_MAX_ZOOM;

		animation.setLimit(configuration?.animation?.queue?.limit ?? 8 * navigator.hardwareConcurrency);
	}

	public setColors(primary: string, background: string, text: string) {
		const container = this.provider.getContainer();
		container.style.setProperty('--map-style-primary', primary);
		container.style.setProperty('--map-style-background', background);
		container.style.setProperty('--map-style-text', text);
	}

	public async updatePopups(popups: MapPopup[]) {
		try {
			// Validate popups
			await mapPopupsSchema.parseAsync(popups);

			// Update data
			await this.updatePopupData(popups);

			// Update max width and height
			this.popupMaxWidth = this.popupDataArray.reduce((a, b) => Math.max(a, b.marker.width), 0);
			this.popupMaxHeight = this.popupDataArray.reduce((a, b) => Math.max(a, b.marker.height), 0);

			// Process popup data
			this.processPopupDataCallback();
		} catch (error: any) {
			console.error(error);
			log('[Error] Failed to update popups', { message: error.message, stack: error.stack });

			throw error;
		}
	}

	public removePopups() {
		try {
			this.removePopupData();
		} catch (error: any) {
			console.error(error);
			log('[Error] Failed to remove popups', { message: error.message, stack: error.stack });

			throw error;
		}
	}

	public togglePopups(states: { id: string; toggled: boolean }[]) {
		try {
			this.togglePopupData(states);
		} catch (error: any) {
			console.error(error);
			log('[Error] Failed to toggle popups', { message: error.message, stack: error.stack });

			throw error;
		}
	}

	private processPopupDataCallback() {
		// Check if map is loaded or marker data is empty
		if (this.popupDataArray.length == 0) return;

		try {
			this.processPopupData();
			window.setTimeout(this.processPopupDataCallback.bind(this), 25);
		} catch (error: any) {
			console.error(error);
			log('[Error] Failed to process popups', { message: error.message, stack: error.stack });
		}
	}

	private processPopupData() {
		// Check if map popup data is updating
		if (this.popupDataUpdating) return;

		// Get map zoom
		const zoom = this.provider.getZoom();
		if (!zoom) return;

		// Get bounds
		const mapWidth = this.provider.getWidth();
		const mapHeight = this.provider.getHeight();
		const mapOffsetX = this.popupMaxWidth * 2;
		const mapOffsetY = this.popupMaxHeight * 2;
		const mapOffsetBounds = new MapBounds(-mapOffsetX, mapHeight + mapOffsetY, mapWidth + mapOffsetX, -mapOffsetY, this.provider.parameters);
		const mapWindowBounds = new MapBounds(0, mapHeight, mapWidth, 0, this.provider.parameters);

		// Track circle count
		let circleCount = 0;

		for (const data of this.popupDataArray) {
			const zoomThreshold = data.supressed ? -1 : zoom;

			// Process popup circle
			const circle = data.circle;

			if (mapWindowBounds.contains(circle.lat, circle.lng)) {
				if (zoomThreshold <= circle.zoom && circle.zoom <= zoom + this.configurationPinMaxZoomDelta) {
					if (circleCount < this.configurationPinMaxCount) {
						// Update circle state
						if (this.configurationPinFade == true) {
							circle.updateState(zoom);
						} else {
							circle.setExpanded();
						}

						// Update circle map
						circle.updateMap(true);

						// Update circle pin if not loaded
						if (circle.isPinLoaded() == false) {
							circle.updatePin();
						}
					}

					circleCount++;
				} else {
					circle.setCollapsed();

					// Wait until circle is invisible before removing it
					if (circle.isCollapsed()) {
						circle.updateMap(false);
					}
				}
			} else {
				// If created immediately remove circle
				circle.updateMap(false);
			}

			// Process popup marker
			const marker = data.marker;

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
				// If created immediately remove marker
				marker.updateMap(false);
			}
		}
	}

	private async updatePopupData(newPopups: MapPopup[]) {
		try {
			this.popupDataUpdating = true;

			// Remove old data
			const newPopupsMap = new Map(newPopups.map((m) => [m.data.id, new MapPopupData(this.provider, m)]));
			const oldPopupDataArray = Array.from(this.popupDataArray);

			for (const oldPopupData of oldPopupDataArray) {
				if (newPopupsMap.has(oldPopupData.id) == false) {
					oldPopupData.remove();

					this.popupDataMap.delete(oldPopupData.id);
					this.popupDataArray.splice(this.popupDataArray.indexOf(oldPopupData), 1);
				}
			}

			// Crate or update new data
			for (const newPopup of newPopups) {
				// Check if data already exists
				const oldData = this.popupDataMap.get(newPopup.data.id);

				if (oldData) {
					// Update data
					oldData.update(newPopup);
				} else {
					// Create data
					const newData = new MapPopupData(this.provider, newPopup);
					newData.create();

					this.popupDataMap.set(newPopup.data.id, newData);
					this.popupDataArray.push(newData);
				}
			}

			this.popupDataArray.sort((a, b) => a.zoom - b.zoom);
		} catch (error) {
			console.error(error);

			this.popupDataArray.length = 0;
			this.popupDataMap.clear();

			throw error;
		} finally {
			this.popupDataUpdating = false;
		}
	}

	private removePopupData() {
		try {
			this.popupDataUpdating = true;

			this.popupDataArray.forEach((data) => data.remove());
			this.popupDataArray.length = 0;
			this.popupDataMap.clear();
		} catch (error) {
			console.error(error);

			this.popupDataArray.forEach((data) => data.remove());
			this.popupDataArray.length = 0;
			this.popupDataMap.clear();

			throw error;
		} finally {
			this.popupDataUpdating = false;
		}
	}

	private togglePopupData(states: { id: string; toggled: boolean }[]) {
		states.forEach((state) => {
			const data = this.popupDataMap.get(state.id);
			if (data) data.supressed = !state.toggled;
		});
	}
}

class MapPopupComponent<T> {
	provider: MapProvider;

	id: string;
	lat: number;
	lng: number;
	zoom: number;

	element: HTMLElement | undefined;
	component: T | undefined;
	marker: MapProviderMarker | undefined;

	constructor(provider: MapProvider, popup: MapPopup) {
		this.provider = provider;
		this.id = popup.data.id;
		this.lat = popup.data.lat;
		this.lng = popup.data.lng;
		this.zoom = popup.state[0];
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

	update(popup: MapPopup) {
		this.zoom = popup.state[0];

		this.updateZIndex();
	}

	updateZIndex() {
		throw new Error('Update z-index not implemented');
	}

	updateMap(contains: boolean) {
		const marker = this.marker;
		const component = this.component;
		if (marker == undefined || component == undefined) throw new Error('Failed to update popup map');

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

class MapPopupCircle extends MapPopupComponent<ReturnType<typeof MapMarkerCircle>> {
	pinLoading = false;
	pinLoaded = false;
	pinCallback: MapPopupContentCallback | undefined;

	constructor(provider: MapProvider, popup: MapPopup) {
		super(provider, popup);

		this.pinCallback = popup.callbacks.pin;
	}

	createElement() {
		this.element = document.createElement('div');
		this.element.classList.add('circle');
		this.component = mount(MapMarkerCircle, {
			target: this.element,
			props: { id: this.id + '_circle', priority: this.zoom * this.provider.parameters.zoomScale }
		});
	}

	updateZIndex() {
		const element = this.element;
		if (!element) return;

		element.style.zIndex = this.getZindex().toString();
	}

	updateMap(contains: boolean) {
		super.updateMap(contains);

		this.component?.setDisplayed(contains);
	}

	updateState(zoom: number) {
		const circle = this.component;
		if (!circle) throw new Error('Failed to update circle state');

		// Set circle scale
		circle.setScale(this.getScale(zoom));
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

	setExpanded() {
		if (this.component == undefined) throw new Error('Failed to set circle expanded');
		this.component.setScale(1);
	}

	setCollapsed() {
		if (this.component == undefined) throw new Error('Failed to set circle collapsed');
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

	isPinLoaded() {
		return this.pinCallback == undefined || this.pinLoaded;
	}
}

class MapPopupMarker extends MapPopupComponent<ReturnType<typeof MapMarker>> {
	width: number;
	height: number;
	padding: number;
	states: [number, number][];

	bodyLoading = false;
	bodyLoaded = false;
	bodyCallback: MapPopupContentCallback;

	constructor(provider: MapProvider, popup: MapPopup) {
		super(provider, popup);

		this.id = popup.data.id;
		this.width = popup.data.width;
		this.height = popup.data.height;
		this.padding = popup.data.padding;
		this.states = popup.state[1].map((s) => [s[0], Angles.DEGREES[s[1]]]);

		this.bodyCallback = popup.callbacks.body;
	}

	createElement() {
		this.element = document.createElement('div');
		this.element.classList.add('marker');
		this.component = mount(MapMarker, {
			target: this.element,
			props: {
				id: this.id + '_marker',
				priority: this.zoom * this.provider.parameters.zoomScale,
				width: this.width,
				height: this.height,
				padding: this.padding
			}
		});
	}

	update(popup: MapPopup) {
		super.update(popup);
		this.states = popup.state[1].map((s) => [s[0], Angles.DEGREES[s[1]]]);
	}

	updateZIndex() {
		const element = this.element;
		if (!element) return;

		const zIndex = this.getZindex() + MAP_MARKERS_Z_INDEX_OFFSET;
		element.style.zIndex = zIndex.toString();
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

class MapPopupData {
	id: string;
	rank: number;
	lat: number;
	lng: number;
	zoom: number;
	supressed: boolean;

	circle: MapPopupCircle;
	marker: MapPopupMarker;

	constructor(provider: MapProvider, popup: MapPopup) {
		this.id = popup.data.id;
		this.rank = popup.data.rank;
		this.lat = popup.data.lat;
		this.lng = popup.data.lng;
		this.zoom = popup.state[0];
		this.supressed = false;

		this.circle = new MapPopupCircle(provider, popup);
		this.marker = new MapPopupMarker(provider, popup);
	}

	create() {
		this.circle.create();
		this.marker.create();
	}

	update(popup: MapPopup) {
		this.circle.update(popup);
		this.marker.update(popup);
	}

	remove() {
		this.circle.remove();
		this.marker.remove();
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
