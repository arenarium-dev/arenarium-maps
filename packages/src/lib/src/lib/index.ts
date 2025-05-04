import { mount, unmount } from 'svelte';

import Map from './components/Map.svelte';
import type { MapComponent } from './map/types.js';
import type {
	MapOptions,
	MapStyle,
	MapPopup,
	MapPopupState,
	MapPopupData,
	MapPopupStatesRequest,
	MapPopupContentCallback
} from './map/schemas.js';

export { Map };
export {
	type MapComponent,
	type MapStyle,
	type MapOptions,
	type MapPopup,
	type MapPopupData,
	type MapPopupState,
	type MapPopupStatesRequest,
	type MapPopupContentCallback
};

export function mountMap(options: MapOptions) {
	const target = document.getElementById(options.container);
	if (!target) throw new Error(`Container not found: ${options.container}`);

	return mount(Map, {
		target: target,
		props: {
			options: options
		}
	}) as MapComponent;
}

export function unmountMap(map: ReturnType<typeof mountMap>) {
	unmount(map);
}
