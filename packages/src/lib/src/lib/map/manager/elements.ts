import { mount } from 'svelte';

import MapTooltipComponent from '../../components/map/Tooltip.svelte';
import MapPinComponent from '../../components/map/Pin.svelte';

import { ANIMATION_PIN_LAYER, ANIMATION_TOOLTIP_LAYER } from '../animation/animation.js';
import { type MapMarker, type MapBodyCallback, type MapTooltipState, type MapProvider, type MapProviderMarker } from '../schemas.js';

import { Angles } from '@workspace/shared/src/constants.js';

const MAP_TOOLTIPS_Z_INDEX_OFFSET = 1000000;
const MAP_POPUPS_Z_INDEX_OFFSET = 2000000;

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
		return super.getZindex() + MAP_TOOLTIPS_Z_INDEX_OFFSET;
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

export { MapPinElement, MapTooltipElement };
