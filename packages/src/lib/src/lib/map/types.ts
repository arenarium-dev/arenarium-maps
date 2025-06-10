import type { MapPopupManager } from '$lib/manager.js';

import { type Map } from 'maplibre-gl';

export interface MapComponent {
	maplibre: () => Map;
	manager: () => MapPopupManager;
}
