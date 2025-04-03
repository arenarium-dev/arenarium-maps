import { getRectangleOffsets } from './rectangle.js';

/**
 * Get the marker position parameters given the marker width, height and angle.
 * The output are the marker x and y offset, the pin angle and skew.
 * The marker pin points from the marker body to the anchor of the marker
 * */
export function getPositionParams(markerWidth: number, markerHeight: number, markerAngle: number) {
	// Calculate marker offsets, its values are such that the rectnagle edge always touches the center anchor
	const markerOffsets = getRectangleOffsets(markerWidth, markerHeight, markerAngle);
	const markerOffsetX = markerOffsets.offsetX;
	const markerOffsetY = markerOffsets.offsetY;

	// Calculate pin angle, it point to the center of the inverse width/height rectangle of the marker
	const pinRectWidth = markerHeight;
	const pinRectHeight = markerWidth;

	const pinRectOffsets = getRectangleOffsets(pinRectWidth, pinRectHeight, markerAngle);
	const pinCenterX = pinRectWidth / 2 + pinRectOffsets.offsetX;
	const pinCenterY = pinRectHeight / 2 + pinRectOffsets.offsetY;
	const pinAngleRad = Math.atan2(pinCenterY, pinCenterX);
	const pinAngleDeg = (pinAngleRad / Math.PI) * 180 - 45;

	// Calculate pin skew, its is lower (ak. wider) the closer the pin is to the center of the marker
	const pinMinSkew = 0;
	const pinMaxSkew = 30;

	const markerCenterX = markerOffsetX + markerWidth / 2;
	const markerCenterY = markerOffsetY + markerHeight / 2;

	const pinCenterDistance = Math.sqrt(markerCenterX * markerCenterX + markerCenterY * markerCenterY);
	const pinCenterMinDistance = Math.min(markerWidth, markerHeight) / 2;
	const pinCenterMaxDistance = Math.sqrt(markerWidth * markerWidth + markerHeight * markerHeight) / 2;

	const pinSkewRatio = (pinCenterDistance - pinCenterMinDistance) / (pinCenterMaxDistance - pinCenterMinDistance);
	const pinSkewDeg = pinMinSkew + pinSkewRatio * (pinMaxSkew - pinMinSkew);

	return {
		markerOffsetX,
		markerOffsetY,
		pinAngleDeg,
		pinSkewDeg
	};
}
