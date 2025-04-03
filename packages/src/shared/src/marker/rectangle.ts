/**
 * Get the rectangles position offsets, its values are such that the rectnagle edge always touches the anchor (0,0)
 * The recangles initial position is such that is top left corner is at the anchor (0,0)
 * The angle is the direction from the achor to the center of the rectangle, to which the rectangle is pointed
 * */
export function getRectangleOffsets(width: number, height: number, angleDeg: number) {
	const angleRad = angleDeg * (Math.PI / 180);

	const widthHalf = width / 2;
	const heightHalf = height / 2;
	const diagonalHalf = Math.sqrt(widthHalf * widthHalf + heightHalf * heightHalf);
	const aspectDeg = Math.atan(heightHalf / widthHalf) * (180 / Math.PI);

	const brDeg = aspectDeg;
	const blDeg = 180 - aspectDeg;
	const trDeg = 180 + aspectDeg;
	const tlDeg = 360 - aspectDeg;

	switch (true) {
		// Quadrant bottom
		case brDeg <= angleDeg && angleDeg <= blDeg: {
			return {
				offsetX: diagonalHalf * Math.cos(angleRad) - widthHalf,
				offsetY: 0
			};
		}
		// Quadrant left
		case blDeg <= angleDeg && angleDeg <= trDeg: {
			return {
				offsetX: -width,
				offsetY: diagonalHalf * Math.sin(angleRad) - heightHalf
			};
		}
		// Quadrant top
		case trDeg <= angleDeg && angleDeg <= tlDeg: {
			return {
				offsetX: diagonalHalf * Math.cos(angleRad) - widthHalf,
				offsetY: -height
			};
		}
		// Quadrant right
		default: {
			return {
				offsetX: 0,
				offsetY: diagonalHalf * Math.sin(angleRad) - heightHalf
			};
		}
	}
}
