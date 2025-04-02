import { mount } from 'svelte';

import Map from './components/Map.svelte';
import type { MapOptions } from './core/validation.js';

export { Map };

export function mountMap(options: MapOptions) {
	const target = document.getElementById(options.container);
	if (!target) throw new Error(`Container not found: ${options.container}`);

	mount(Map, {
		target: target,
		props: {
			options: options
		}
	});
}
