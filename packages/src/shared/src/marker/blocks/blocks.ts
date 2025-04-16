import { getThresholds } from './thresholds.js';
import { getPoint } from '../projection.js';
import { type Types } from '../../types.js';
import { MAP_MIN_ZOOM, MAP_MAX_ZOOM, MARKER_PADDING } from '../../constants.js';

const MARKERS_PER_BLOCK_TARGET = 64;

function getBlocksZoomStep(markersLength: number, zoomStep: number): number {
	// Adjust the zoom step based on the number of markers
	// so that each block markers lenght is around the given size
	// MAP_MAX_ZOOM - MAP_MIN_ZOOM shoud be a power of 2, eg 16
	// zoomStep should be a power of 2
	if (zoomStep == 1) return 1;

	let blockLevels = (MAP_MAX_ZOOM - MAP_MIN_ZOOM) / zoomStep;
	let blockCount = (1 / 3) * (Math.pow(4, blockLevels) - 1);

	let markersPerBlock = Math.ceil(markersLength / blockCount);
	if (markersPerBlock > MARKERS_PER_BLOCK_TARGET) return getBlocksZoomStep(markersLength, Math.round(zoomStep / 2));

	return zoomStep;
}

export function getBlocks(popups: Types.Popup[]): Types.Block[] {
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

	// Validate and load expansion results
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

	for (const marker of markers) {
		if (isNaN(marker.zet)) throw new Error('Marker zet is NaN');
		if (marker.angs.length == 0) throw new Error('Marker angs is empty');
	}

	// Calculate blocks
	const blocks = new Array<Types.Block>();

	const zoomMin = MAP_MIN_ZOOM;
	const zoomStep = getBlocksZoomStep(markers.length, MAP_MAX_ZOOM - MAP_MIN_ZOOM);

	const latMin = -90;
	const latMax = 90;
	const lngMin = -180;
	const lngMax = 180;

	for (const marker of markers) {
		let block = blocks
			.filter((b) => b.zs <= marker.zet && marker.zet <= b.ze)
			.find((b) => b.sw.lat <= marker.lat && marker.lat <= b.ne.lat && b.sw.lng <= marker.lng && marker.lng <= b.ne.lng);

		if (block === undefined) {
			const zoomStart = zoomMin + Math.floor((marker.zet - zoomMin) / zoomStep) * zoomStep;
			const zoomEnd = Math.floor(zoomStart + zoomStep);

			const blockLevel = Math.floor((zoomStart - zoomMin) / zoomStep);
			const blockSize = Math.pow(2, blockLevel);
			const blockSizeLat = (latMax - latMin) / blockSize;
			const blockSizeLng = (lngMax - lngMin) / blockSize;

			const blockRowId = Math.floor(((marker.lat - latMin) / (latMax - latMin)) * blockSize);
			const blockColId = Math.floor(((marker.lng - lngMin) / (lngMax - lngMin)) * blockSize);

			const swLat = latMin + blockRowId * blockSizeLat;
			const swLng = lngMin + blockColId * blockSizeLng;
			const neLat = swLat + blockSizeLat;
			const neLng = swLng + blockSizeLng;

			block = {
				id: `${blockLevel}_${blockRowId}_${blockColId}`,
				sw: { lat: swLat, lng: swLng },
				ne: { lat: neLat, lng: neLng },
				zs: zoomStart,
				ze: zoomEnd,
				markers: []
			};
			blocks.push(block);
		}

		block.markers.push(marker);
	}

	return blocks;
}
