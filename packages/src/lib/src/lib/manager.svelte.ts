import { mount } from 'svelte';

import MapMarker from './components/marker/Marker.svelte';
import MapMarkerCircle from './components/marker/Circle.svelte';

import { log } from './map/log.js';
import { animation } from './map/animation/animation.js';
import { MapBoundsPair } from './map/bounds.js';
import { mapPopupsSchema, type MapPopup, type MapPopupContentCallback, type MapConfiguration, mapConfigurationSchema } from './map/schemas.js';

import {
	MAP_BASE_SIZE,
	MAP_MAX_ZOOM,
	MAP_MIN_ZOOM,
	MAP_ZOOM_SCALE,
	MAP_MARKERS_Z_INDEX_OFFSET,
	MAP_CIRCLES_MAX_COUNT,
	MAP_CIRCLES_MAX_ZOOM,
	Angles
} from '@workspace/shared/src/constants.js';

import maplibre from 'maplibre-gl';

export class MapManager {
	private map: maplibre.Map;
	private configuration: MapConfiguration | undefined;

	private popupsIntervalId: number | undefined;
	private popupDataArray = new Array<MapPopupData>();
	private popupDataMap = new Map<string, MapPopupData>();
	private popupDataUpdating = false;

	constructor(map: maplibre.Map, configuration?: MapConfiguration) {
		this.map = map;
		this.configuration = configuration;

		this.initializeConfiguration();
		this.initializeInputOptions();

		this.map.on('load', () => {
			this.initializeProcessTimer();
		});
	}

	private initializeConfiguration() {
		if (this.configuration) {
			mapConfigurationSchema.parse(this.configuration);
		}

		animation.setLimit(this.configuration?.animation?.queue?.limit ?? 8 * navigator.hardwareConcurrency);
	}

	private initializeInputOptions() {
		console.warn('Overriding maplibre input options!');

		// Disable map rotation using right click + drag
		this.map.dragRotate.disable();
		// Disable map rotation using keyboard
		this.map.keyboard.disable();
		// Disable map rotation using touch rotation gesture
		this.map.touchZoomRotate.disableRotation();
		// Disable map pitch using touch pitch gesture
		this.map.touchPitch.disable();
	}

	private initializeProcessTimer() {
		const loop = () => {
			try {
				this.processPopupData();
				this.popupsIntervalId = window.setTimeout(loop, 25);
			} catch (error: any) {
				console.error(error);
				log('[Error] Failed to process popups', { message: error.message, stack: error.stack });
			}
		};

		loop();
		return () => clearInterval(this.popupsIntervalId);
	}

	private processPopupData() {
		if (this.map == undefined) return;

		if (this.popupDataArray.length == 0) return;
		if (this.popupDataUpdating) return;

		const mapOffset = MAP_BASE_SIZE;
		const mapHeight = this.map.getCanvas().height;
		const mapWidth = this.map.getCanvas().width;
		const mapWindowBounds = new MapBoundsPair(this.map, 0, mapHeight, mapWidth, 0);
		const mapOffsetBounds = new MapBoundsPair(this.map, -mapOffset, mapHeight + mapOffset, mapWidth + mapOffset, -mapOffset);

		// Get map zoom
		const zoom = this.map.getZoom();
		if (!zoom) return;

		let circleCount = 0;
		let circleCountMax = this.configuration?.pin?.maxCount ?? Math.max(MAP_CIRCLES_MAX_COUNT, 8 * navigator.hardwareConcurrency);
		let circleZoomMax = this.configuration?.pin?.maxZoom ?? MAP_CIRCLES_MAX_ZOOM;

		for (const data of this.popupDataArray) {
			const zoomThreshold = data.supressed ? -1 : zoom;

			// Process popup circle
			const circle = data.circle;

			if (mapWindowBounds.contains(circle.lat, circle.lng)) {
				if (zoomThreshold <= circle.zoom && circle.zoom <= zoom + circleZoomMax) {
					if (circleCount < circleCountMax) {
						// Update circle state
						if (this.configuration?.pin?.fade == true) {
							circle.updateState(zoom);
						} else {
							circle.setExpanded();
						}

						// Update circle map
						circle.updateMap(this.map);

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
						circle.updateMap(null);
					}
				}
			} else {
				// If created immediately remove circle
				circle.updateMap(null);
			}

			// Process popup marker
			const marker = data.marker;

			if (mapOffsetBounds.contains(marker.lat, marker.lng)) {
				if (marker.zoom <= zoomThreshold) {
					// Update marker state
					marker.updateState(zoom);
					marker.setCollapsed(false);

					// Update marker map
					marker.updateMap(this.map);

					// If marker is expanded, update body if not loaded
					if (marker.isExpanded() && marker.isBodyLoaded() == false) {
						marker.updateBody();
					}
				} else {
					// Check if marker exist on map
					marker.setCollapsed(true);

					// Wait until marker is collapsed before removing it
					if (marker.isCollapsed()) {
						marker.updateMap(null);
					}
				}
			} else {
				// If created immediately remove marker
				marker.updateMap(null);
			}
		}
	}

	private updatePopupData(newPopups: MapPopup[]) {
		try {
			this.popupDataUpdating = true;

			// Remove old data
			const newPopupsMap = new Map(newPopups.map((m) => [m.data.id, new MapPopupData(m)]));
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
					const newData = new MapPopupData(newPopup);
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

	public async updatePopups(popups: MapPopup[]) {
		try {
			// Validate popups
			await mapPopupsSchema.parseAsync(popups);

			// Update data
			await this.updatePopupData(popups);
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

	constructor(popup: MapPopup) {
		this.id = popup.data.id;
		this.rank = popup.data.rank;
		this.lat = popup.data.lat;
		this.lng = popup.data.lng;
		this.zoom = popup.state[0];
		this.supressed = false;

		this.circle = new MapPopupCircle(popup);
		this.marker = new MapPopupMarker(popup);
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
	}

	create() {
		this.createElement();
		this.createLibreMarker();
		this.updateZIndex();
	}

	createElement() {
		throw new Error('Create element not implemented');
	}

	createLibreMarker() {
		const element = this.element;
		if (!element) throw new Error('Failed to create libre marker');

		// Create new libre marker
		const libreMarker = new maplibre.Marker({ element: element });
		libreMarker.setLngLat([this.lng, this.lat]);
		this.libreMarker = libreMarker;
	}

	update(popup: MapPopup) {
		this.zoom = popup.state[0];

		this.updateZIndex();
	}

	updateZIndex() {
		throw new Error('Update z-index not implemented');
	}

	updateMap(map: maplibregl.Map | null) {
		const libreMarker = this.libreMarker;
		const component = this.component;
		if (libreMarker == undefined || component == undefined) throw new Error('Failed to update popup map');

		if (map) {
			if (libreMarker._map != map) {
				libreMarker.addTo(map);
			}
		} else {
			if (libreMarker._map != null) {
				libreMarker.remove();
			}
		}
	}

	isInBlock(zoom: number, bounds: MapBoundsPair) {
		return this.zoom <= zoom && bounds.contains(this.lat, this.lng);
	}

	remove() {
		this.libreMarker?.remove();
		this.element?.remove();
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
		this.component = mount(MapMarkerCircle, {
			target: this.element,
			props: { id: this.id + '_circle', priority: this.zoom * MAP_ZOOM_SCALE }
		});
	}

	updateZIndex() {
		const element = this.element;
		if (!element) return;

		const zIndex = Math.round((MAP_MAX_ZOOM - this.zoom) * MAP_ZOOM_SCALE);
		element.style.zIndex = zIndex.toString();
	}

	updateMap(map: maplibregl.Map | null) {
		super.updateMap(map);

		this.component?.setDisplayed(map != null);
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
	states: [number, number][];

	bodyLoading = false;
	bodyLoaded = false;
	bodyCallback: MapPopupContentCallback;

	constructor(popup: MapPopup) {
		super(popup);

		this.id = popup.data.id;
		this.width = popup.data.width;
		this.height = popup.data.height;
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
				priority: this.zoom * MAP_ZOOM_SCALE,
				width: this.width,
				height: this.height
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

		const zIndex = Math.round((MAP_MAX_ZOOM - this.zoom) * MAP_ZOOM_SCALE) + MAP_MARKERS_Z_INDEX_OFFSET;
		element.style.zIndex = zIndex.toString();
	}

	updateMap(map: maplibregl.Map | null) {
		super.updateMap(map);

		this.component?.setDisplayed(map != null);
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
