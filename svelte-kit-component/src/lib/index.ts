import { mount } from 'svelte';

import Map from '$lib/Map.svelte';

export { Map };

export function init(elementId: string) {
	const target = document.getElementById(elementId);
	if (!target) throw new Error(`Element with id ${elementId} not found`);

	mount(Map, { target: target });
}
