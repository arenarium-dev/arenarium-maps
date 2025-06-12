export namespace Rectangle {
	/**
	 * Get the rectangles position offsets, its values are such that the rectnagle edge always touches the anchor (0,0)
	 * The recangles initial position is such that is top left corner is at the anchor (0,0)
	 * The angle is the direction from the achor to the center of the rectangle, to which the rectangle is pointed
	 * */
	export function getOffsets(width: number, height: number, angleDeg: number) {
		const widthHalf = width / 2;
		const heightHalf = height / 2;
		const diagonalHalf = Math.sqrt(widthHalf * widthHalf + heightHalf * heightHalf);

		const aspectDeg = Math.atan(heightHalf / widthHalf) * (180 / Math.PI);
		const angleRad = angleDeg * (Math.PI / 180);

		// \Q4/
		// Q\/Q
		// 3/\1
		// /Q2\

		if (angleDeg < 180) {
			if (angleDeg < 90) {
				if (angleDeg < aspectDeg) {
					// Q1
					return {
						offsetX: 0,
						offsetY: diagonalHalf * Math.sin(angleRad) - heightHalf
					};
				} else {
					// Q2
					return {
						offsetX: diagonalHalf * Math.cos(angleRad) - widthHalf,
						offsetY: 0
					};
				}
			} else {
				if (angleDeg < 180 - aspectDeg) {
					// Q2
					return {
						offsetX: diagonalHalf * Math.cos(angleRad) - widthHalf,
						offsetY: 0
					};
				} else {
					//Q3
					return {
						offsetX: -width,
						offsetY: diagonalHalf * Math.sin(angleRad) - heightHalf
					};
				}
			}
		} else {
			if (angleDeg < 270) {
				if (angleDeg < 180 + aspectDeg) {
					// Q3
					return {
						offsetX: -width,
						offsetY: diagonalHalf * Math.sin(angleRad) - heightHalf
					};
				} else {
					// Q4
					return {
						offsetX: diagonalHalf * Math.cos(angleRad) - widthHalf,
						offsetY: -height
					};
				}
			} else {
				if (angleDeg < 360 - aspectDeg) {
					// Q4
					return {
						offsetX: diagonalHalf * Math.cos(angleRad) - widthHalf,
						offsetY: -height
					};
				} else {
					//Q1
					return {
						offsetX: 0,
						offsetY: diagonalHalf * Math.sin(angleRad) - heightHalf
					};
				}
			}
		}
	}
}
