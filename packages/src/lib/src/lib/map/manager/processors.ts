import { MapBounds } from './bounds.js';
import { MapPinElement, MapTooltipElement } from './elements.js';

import { type MapConfiguration, type MapProvider } from '../schemas.js';

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
		}
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

export { MapPinProcessor, MapTooltipProcessor };
