import type { Types } from '@workspace/shared/src/types.js';

export async function getMarkers(popups: Types.Popup[]): Promise<Types.Marker[]> {
	if (import.meta.env.DEV) {
		switch (import.meta.env.MODE) {
			case 'browser': {
				const markersImport = await import('@workspace/shared/src/marker/compute/markers.js');
				return markersImport.getMarkers(popups);
			}
			default: {
				return await getMarkersApi(popups);
			}
		}
	} else {
		return await getMarkersApi(popups);
	}
}

async function getMarkersApi(popups: Types.Popup[]): Promise<Types.Marker[]> {
	const url = import.meta.env.VITE_API_URL;
	const response = await fetch(`${url}/v1/markers`, {
		method: 'POST',
		body: JSON.stringify(popups)
	});

	if (!response.ok || !response.body) {
		throw new Error('Failed to get markers');
	}

	const markers: Types.Marker[] = await response.json();
	return markers;
}
