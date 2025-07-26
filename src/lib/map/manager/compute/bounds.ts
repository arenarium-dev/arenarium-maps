export namespace Bounds {
	export interface Overlappable {
		// Anchor
		x: number;
		y: number;
		// Distances from anchor
		distances: Distances;
	}

	export interface Distances {
		left: number;
		right: number;
		top: number;
		bottom: number;
	}

	export function areOverlaping(a: Overlappable, b: Overlappable): boolean {
		if (a.x - a.distances.left > b.x + b.distances.right) return false;
		if (a.x + a.distances.right < b.x - b.distances.left) return false;
		if (a.y - a.distances.top > b.y + b.distances.bottom) return false;
		if (a.y + a.distances.bottom < b.y - b.distances.top) return false;
		return true;
	}

	export function getZoomWhenTouching(a: Overlappable, b: Overlappable): number {
		let xDistance0 = Math.abs(a.x - b.x);
		let xDistanceZ = a.x < b.x ? a.distances.right + b.distances.left : a.distances.left + b.distances.right;
		let xRatio = xDistanceZ / xDistance0;

		let yDistance0 = Math.abs(a.y - b.y);
		let yDistanceZ = a.y < b.y ? a.distances.bottom + b.distances.top : a.distances.top + b.distances.bottom;
		let yRatio = yDistanceZ / yDistance0;

		let minRatio = Math.min(xRatio, yRatio);
		let zoom = Math.log2(minRatio);
		return zoom;
	}
}
