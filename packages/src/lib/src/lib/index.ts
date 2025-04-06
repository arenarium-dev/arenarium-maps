import { mount, unmount } from 'svelte';

import Map from './components/Map.svelte';
import type { MapOptions } from './map/input.js';
import type { MapComponent } from './map/types.js';

export { Map };

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
