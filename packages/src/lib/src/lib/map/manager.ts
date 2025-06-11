import { mount } from 'svelte';

import MapMarker from '../components/marker/Marker.svelte';
import MapMarkerCircle from '../components/marker/Circle.svelte';

import { log } from './log.js';
import { animation } from './animation/animation.js';
import { MapBoundsPair } from './bounds.js';
import { mapPopupsSchema, type MapConfiguration, type MapPopup, type MapPopupContentCallback } from './schemas.js';

import {
	Angles,
	MAP_BASE_SIZE,
	MAP_CIRCLES_MAX_COUNT,
	MAP_CIRCLES_MAX_ZOOM,
	MAP_MARKERS_Z_INDEX_OFFSET,
	MAP_MAX_ZOOM,
	MAP_ZOOM_SCALE
} from '@workspace/shared/src/constants.js';

interface MapLibreClass {
	new (options: maplibregl.MapOptions): maplibregl.Map;
}

interface MapLibreMarkerClass {
	new (options: maplibregl.MarkerOptions): maplibregl.Marker;
}

class MapManager {
	private MapClass: MapLibreClass;
	private MapMarkerClass: MapLibreMarkerClass;

	private map: maplibregl.Map;

	private mapConfiguration: MapConfiguration | null = null;

	private mapPopupDataArray = new Array<MapPopupData>();
	private mapPopupDataMap = new Map<string, MapPopupData>();
	private mapPopupDataUpdating = false;

	constructor(mapClass: MapLibreClass, mapMarkerClass: MapLibreMarkerClass, options: maplibregl.MapOptions) {
		this.MapClass = mapClass;
		this.MapMarkerClass = mapMarkerClass;

		this.map = new this.MapClass({
			...options,
			pitchWithRotate: false,
			attributionControl: { customAttribution: '@arenarium/maps' }
		});
		// Disable map rotation using right click + drag
		this.map.dragRotate.disable();
		// Disable map rotation using keyboard
		this.map.keyboard.disable();
		// Disable map rotation using touch rotation gesture
		this.map.touchZoomRotate.disableRotation();
		// Disable map pitch using touch pitch gesture
		this.map.touchPitch.disable();
		// On load event
		this.map.on('load', this.onMapLoad.bind(this));

		this.setConfiguration(null);
	}

	get maplibre() {
		return this.map;
	}

	public setConfiguration(configuration: MapConfiguration | null) {
		this.mapConfiguration = configuration;

		if (configuration?.animation?.queue?.limit) {
			animation.setLimit(configuration.animation.queue.limit);
		} else {
			animation.setLimit(8 * navigator.hardwareConcurrency);
		}
	}

	public setColors(primary: string, background: string, text: string) {
		const container = this.map.getContainer();
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

	private onMapLoad() {
		this.processPopupDataCallback();
	}

	private processPopupDataCallback() {
		if (this.map._removed) return;

		try {
			this.processPopupData();
			window.setTimeout(this.processPopupDataCallback.bind(this), 25);
		} catch (error: any) {
			console.error(error);
			log('[Error] Failed to process popups', { message: error.message, stack: error.stack });
		}
	}

	private processPopupData() {
		// Check if map is loaded or marker data is empty
		if (this.mapPopupDataArray.length == 0) return;
		if (this.mapPopupDataUpdating) return;

		// Get map zoom
		const zoom = this.map.getZoom();
		if (!zoom) return;

		// Get bounds
		const mapWidth = this.map.getCanvas().width;
		const mapHeight = this.map.getCanvas().height;
		const mapOffset = MAP_BASE_SIZE;
		const mapOffsetBounds = new MapBoundsPair(this.map, -mapOffset, mapHeight + mapOffset, mapWidth + mapOffset, -mapOffset);
		const mapWindowBounds = new MapBoundsPair(this.map, 0, mapHeight, mapWidth, 0);

		let circleCount = 0;
		let circleCountMax = this.mapConfiguration?.pin?.maxCount ?? Math.max(MAP_CIRCLES_MAX_COUNT, 8 * navigator.hardwareConcurrency);
		let circleZoomMax = this.mapConfiguration?.pin?.maxZoom ?? MAP_CIRCLES_MAX_ZOOM;

		for (const data of this.mapPopupDataArray) {
			const zoomThreshold = data.supressed ? -1 : zoom;

			// Process popup circle
			const circle = data.circle;

			if (mapWindowBounds.contains(circle.lat, circle.lng)) {
				if (zoomThreshold <= circle.zoom && circle.zoom <= zoom + circleZoomMax) {
					if (circleCount < circleCountMax) {
						// Update circle state
						if (this.mapConfiguration?.pin?.fade == true) {
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

	private async updatePopupData(newPopups: MapPopup[]) {
		try {
			this.mapPopupDataUpdating = true;

			// Remove old data
			const newPopupsMap = new Map(newPopups.map((m) => [m.data.id, new MapPopupData(m)]));
			const oldPopupDataArray = Array.from(this.mapPopupDataArray);

			for (const oldPopupData of oldPopupDataArray) {
				if (newPopupsMap.has(oldPopupData.id) == false) {
					oldPopupData.remove();

					this.mapPopupDataMap.delete(oldPopupData.id);
					this.mapPopupDataArray.splice(this.mapPopupDataArray.indexOf(oldPopupData), 1);
				}
			}

			// Crate or update new data
			for (const newPopup of newPopups) {
				// Check if data already exists
				const oldData = this.mapPopupDataMap.get(newPopup.data.id);

				if (oldData) {
					// Update data
					oldData.update(newPopup);
				} else {
					// Create data
					const newData = new MapPopupData(newPopup);
					newData.create(this.MapMarkerClass);

					this.mapPopupDataMap.set(newPopup.data.id, newData);
					this.mapPopupDataArray.push(newData);
				}
			}

			this.mapPopupDataArray.sort((a, b) => a.zoom - b.zoom);
		} catch (error) {
			console.error(error);

			this.mapPopupDataArray.length = 0;
			this.mapPopupDataMap.clear();

			throw error;
		} finally {
			this.mapPopupDataUpdating = false;
		}
	}

	private removePopupData() {
		try {
			this.mapPopupDataUpdating = true;

			this.mapPopupDataArray.forEach((data) => data.remove());
			this.mapPopupDataArray.length = 0;
			this.mapPopupDataMap.clear();
		} catch (error) {
			console.error(error);

			this.mapPopupDataArray.forEach((data) => data.remove());
			this.mapPopupDataArray.length = 0;
			this.mapPopupDataMap.clear();

			throw error;
		} finally {
			this.mapPopupDataUpdating = false;
		}
	}

	private togglePopupData(states: { id: string; toggled: boolean }[]) {
		states.forEach((state) => {
			const data = this.mapPopupDataMap.get(state.id);
			if (data) data.supressed = !state.toggled;
		});
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

	create(libreMarkerClass: MapLibreMarkerClass) {
		this.createElement();
		this.createLibreMarker(libreMarkerClass);
		this.updateZIndex();
	}

	createElement() {
		throw new Error('Create element not implemented');
	}

	createLibreMarker(libreMarkerClass: MapLibreMarkerClass) {
		const element = this.element;
		if (!element) throw new Error('Failed to create libre marker');

		// Create new libre marker
		const libreMarker = new libreMarkerClass({ element: element });
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
	padding: number;
	states: [number, number][];

	bodyLoading = false;
	bodyLoaded = false;
	bodyCallback: MapPopupContentCallback;

	constructor(popup: MapPopup) {
		super(popup);

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
				priority: this.zoom * MAP_ZOOM_SCALE,
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

	create(libreMarkerClass: MapLibreMarkerClass) {
		this.circle.create(libreMarkerClass);
		this.marker.create(libreMarkerClass);
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

export { MapManager };
