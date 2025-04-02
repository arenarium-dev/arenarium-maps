import { mount } from 'svelte';

import Map from './components/Map.svelte';
import type { MapOptions } from './core/validation.js';

export { Map };

export function mountMap(options: MapOptions) {
	const getTarget = () => {
		if (options.container instanceof HTMLElement) {
			return options.container;
		}

		if (typeof options.container === 'string') {
			const target = document.getElementById(options.container);
			if (!target) throw new Error(`Container not found: ${options.container}`);
			return target;
		}

		throw new Error('Invalid container');
	};

	const target = getTarget();

	mount(Map, {
		target: target,
		props: {
			options: options
		}
	});
}
