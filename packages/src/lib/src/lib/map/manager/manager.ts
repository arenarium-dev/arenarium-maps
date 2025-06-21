import { MapBounds } from './bounds.js';
import { MapPinElement, MapTooltipElement } from './elements.js';
import { MapPinProcessor, MapTooltipProcessor } from './processors.js';

import { log } from '../log.js';
import { animation } from '../animation/animation.js';
import {
	mapMarkersSchema,
	mapProviderSchema,
	type MapConfiguration,
	type MapMarker,
	type MapTooltipState,
	type MapTooltipStatesRequest,
	type MapProvider
} from '../schemas.js';

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
	lat: number;
	lng: number;
	zoom: number;

	pin: MapPinElement;
	tooltip: MapTooltipElement;

	constructor(provider: MapProvider, marker: MapMarker, state: MapTooltipState) {
		this.id = marker.id;
		this.rank = marker.rank;
		this.lat = marker.lat;
		this.lng = marker.lng;
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

export { MapManager };
