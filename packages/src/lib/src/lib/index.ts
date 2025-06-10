import { mount, unmount } from 'svelte';

import Map from './components/Map.svelte';

import { MapManager } from './manager.js';
import { MapDarkStyle, MapStyleLight } from './map/styles.js';
import type { MapConfiguration, MapPopup, MapPopupState, MapPopupData, MapPopupStatesRequest, MapPopupContentCallback } from './map/schemas.js';

import type { MapOptions } from 'maplibre-gl';

export function mountMap(options: MapOptions) {
	const target = typeof options.container === 'string' ? document.getElementById(options.container) : options.container;
	if (!target) throw new Error(`Container not found: ${options.container}`);

	const component = mount(Map, {
		target: target,
		props: { options: options }
	});

	return {
		maplibregl: component.libre() as maplibregl.Map,
		manager: component.manager() as MapManager,
		unmount: () => unmount(component)
	}
}

export { MapManager };
export { MapDarkStyle, MapStyleLight };
export { type MapConfiguration, type MapPopup, type MapPopupData, type MapPopupState, type MapPopupStatesRequest, type MapPopupContentCallback };
