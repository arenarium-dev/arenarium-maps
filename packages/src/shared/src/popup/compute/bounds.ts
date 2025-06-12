export interface Bounds {
	// Anchor
	x: number;
	y: number;
	// Distances from anchor
	left: number;
	right: number;
	top: number;
	bottom: number;
}

export namespace Bounds {
	export function areOverlaping(bounds1: Bounds, bounds2: Bounds): boolean {
		if (bounds1.x - bounds1.left > bounds2.x + bounds2.right) return false;
		if (bounds1.x + bounds1.right < bounds2.x - bounds2.left) return false;
		if (bounds1.y - bounds1.top > bounds2.y + bounds2.bottom) return false;
		if (bounds1.y + bounds1.bottom < bounds2.y - bounds2.top) return false;
		return true;
	}

	export function getZoomWhenTouching(bounds1: Bounds, bounds2: Bounds): number {
		let xDistance0 = Math.abs(bounds1.x - bounds2.x);
		let xDistanceZ = bounds1.x < bounds2.x ? bounds1.right + bounds2.left : bounds1.left + bounds2.right;
		let xRatio = xDistanceZ / xDistance0;

		let yDistance0 = Math.abs(bounds1.y - bounds2.y);
		let yDistanceZ = bounds1.y < bounds2.y ? bounds1.bottom + bounds2.top : bounds1.top + bounds2.bottom;
		let yRatio = yDistanceZ / yDistance0;

		let minRatio = Math.min(xRatio, yRatio);
		let zoom = Math.log2(minRatio);
		return zoom;
	}
}
