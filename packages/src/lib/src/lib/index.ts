import { mount, unmount } from 'svelte';

import Map from './components/Map.svelte';

import { MapPopupManager } from './manager.js';
import { MapDarkStyle, MapStyleLight } from './map/styles.js';
import type { MapConfiguration, MapPopup, MapPopupState, MapPopupData, MapPopupStatesRequest, MapPopupContentCallback } from './map/schemas.js';
import type { MapComponent } from './map/types.js';

import type { MapOptions } from 'maplibre-gl';

export function mountMap(container: string, options: MapOptions): MapComponent {
	const target = document.getElementById(container);
	if (!target) throw new Error(`Container not found: ${options.container}`);

	return mount(Map, {
		target: target,
		props: { options: options }
	}) as MapComponent;
}

export function unmountMap(map: ReturnType<typeof mountMap>) {
	unmount(map);
}

export { MapPopupManager };
export { MapDarkStyle, MapStyleLight };
export { type MapConfiguration, type MapPopup, type MapPopupData, type MapPopupState, type MapPopupStatesRequest, type MapPopupContentCallback };
