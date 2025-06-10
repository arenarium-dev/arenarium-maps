import type { MapPopupManager } from '$lib/manager.js';

import { type Map } from 'maplibre-gl';

export interface MapComponent {
	libre: () => Map;
	manager: () => MapPopupManager;
}
