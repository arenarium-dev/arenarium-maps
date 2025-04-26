import type { Types } from '@workspace/shared/src/types.js';

export async function getMarkers(request: Types.MarkersRequest): Promise<Types.Marker[]> {
	if (import.meta.env.DEV) {
		switch (import.meta.env.MODE) {
			case 'browser': {
				const markersImport = await import('@workspace/shared/src/marker/compute/markers.js');
				return markersImport.getMarkers(request.popups, request.minZoom, request.maxZoom);
			}
			default: {
				return await getMarkersApi(request);
			}
		}
	} else {
		return await getMarkersApi(request);
	}
}

async function getMarkersApi(request: Types.MarkersRequest): Promise<Types.Marker[]> {
	const url = import.meta.env.VITE_API_URL;
	const response = await fetch(`${url}/v1/markers`, {
		method: 'POST',
		body: JSON.stringify(request)
	});

	if (!response.ok || !response.body) {
		throw new Error('Failed to get markers');
	}

	const markers: Types.Marker[] = await response.json();
	return markers;
}
