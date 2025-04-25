import type { Types } from '@workspace/shared/src/types.js';

export async function getMarkers(
	apiKey: string,
	popups: Types.Popup[],
	minZoom: number,
	maxZoom: number
): Promise<Types.Marker[]> {
	if (import.meta.env.DEV) {
		switch (import.meta.env.MODE) {
			case 'browser': {
				const markersImport = await import('@workspace/shared/src/marker/compute/markers.js');
				return markersImport.getMarkers(popups, minZoom, maxZoom);
			}
			default: {
				return await getMarkersApi(apiKey, popups, minZoom, maxZoom);
			}
		}
	} else {
		return await getMarkersApi(apiKey, popups, minZoom, maxZoom);
	}
}

async function getMarkersApi(apiKey: string, popups: Types.Popup[], minZoom: number, maxZoom: number): Promise<Types.Marker[]> {
	const url = import.meta.env.VITE_API_URL;
	const body: Types.MarkersRequest = {
		apiKey: apiKey,
		popups: popups,
		minZoom: minZoom,
		maxZoom: maxZoom
	};
	const response = await fetch(`${url}/v1/markers`, {
		method: 'POST',
		body: JSON.stringify(body)
	});

	if (!response.ok || !response.body) {
		throw new Error('Failed to get markers');
	}

	const markers: Types.Marker[] = await response.json();
	return markers;
}
