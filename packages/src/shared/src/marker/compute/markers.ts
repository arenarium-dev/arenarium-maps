import { getThresholds } from './thresholds.js';
import { getPoint } from '../projection.js';
import { MARKER_PADDING } from '../../constants.js';
import { type Types } from '../../types.js';

export function getMarkers(popups: Types.Popup[]): Types.Marker[] {
	// Calculate the thresholds
	const thresholdProjections = popups.map((m) => getPoint(m.lat, m.lng));
	const thresholdMarkers = popups.map((m, i) => ({
		id: m.id,
		x: thresholdProjections[i].x,
		y: thresholdProjections[i].y,
		width: m.width + 2 * MARKER_PADDING,
		height: m.height + 2 * MARKER_PADDING,
		rank: popups.length - m.index
	}));
	const thresholds = getThresholds(thresholdMarkers);

	// Load threshold results
	const markers = popups.map(
		(m) =>
			({
				id: m.id,
				lat: m.lat,
				lng: m.lng,
				width: m.width,
				height: m.height,
				zet: NaN,
				angs: []
			}) as Types.Marker
	);
	const markerMap = new Map(markers.map((p) => [p.id, p]));

	for (const threshold of thresholds) {
		for (const id of threshold.ids) {
			if (!id) throw new Error('Marker id is not valid');

			const marker = markerMap.get(id);
			if (!marker) throw new Error('Marker not found');

			if (isNaN(marker.zet)) {
				marker.zet = threshold.zoom;
			}
		}

		for (const angle of threshold.angles) {
			if (!angle.id) throw new Error('Marker angle id is not valid');
			if (angle.value == undefined || angle.value == null) throw new Error('Marker angle val is not valid');

			const marker = markerMap.get(angle.id);
			if (!marker) throw new Error('Marker not found');

			// If the last angle value is different from the new angle value, add the new angle
			// (ang[0] = threshold, ang[1] = value)
			if (marker.angs.length == 0 || marker.angs[marker.angs.length - 1][1] != angle.value) {
				marker.angs.push([threshold.zoom, angle.value]);
			}
		}
	}

	// Validate markers
	for (const marker of markers) {
		if (isNaN(marker.zet)) throw new Error('Marker zet is NaN');
		if (marker.angs.length == 0) throw new Error('Marker angs is empty');
	}

	return markers;
}
