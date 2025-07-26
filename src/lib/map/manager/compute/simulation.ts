import { Angles } from '$lib/map/constants.js';

export namespace Simulation {
	const RADIANS = Angles.DEGREES.map((d) => (d * Math.PI) / 180);
	const RADIANS_COS = RADIANS.map((r) => Math.cos(r));
	const RADIANS_SIN = RADIANS.map((r) => Math.sin(r));

	export class Particle {
		/** The center x coordinate of the particle. */
		x: number;
		/** The center y coordinate of the particle. */
		y: number;
		/** The distance x of the rectangle of possible positions of the particle. */
		distX: number;
		/** The distance y of the rectangle of possible positions of the particle. */
		distY: number;
		/** The index of the particle position in the points array. */
		index: number;
		/** The particles that influence the particle. */
		neighbours: Particle[];

		constructor(x: number, y: number, distX: number, distY: number, index: number) {
			this.x = x;
			this.y = y;
			this.distX = distX;
			this.distY = distY;
			this.index = index;
			this.neighbours = [];
		}
	}

	export interface Item {
		particle: Particle;
	}

	function getAngleForceQuadrantIndex(forceX: number, forceY: number) {
		const ratio = Math.abs(forceY / forceX);

		// Rounding to 30 degrees, so binary search is possible
		// tan(45) = 1
		if (ratio < 1) {
			// tan(15) = 0.26795
			if (ratio < 0.26795) {
				return 0; // 0 deg;
			} else {
				return 1; // 30 deg;
			}
		} else {
			// tan(75) = 3.73205
			if (ratio < 3.73205) {
				return 2; // 60 deg;
			} else {
				return 3; // 90 deg;
			}
		}
	}

	function getAngleForceIndex(forceX: number, forceY: number) {
		const index = getAngleForceQuadrantIndex(forceX, forceY);

		if (forceX > 0) {
			if (forceY > 0) {
				return (12 - index) % 12;
			} else {
				return 0 + index;
			}
		} else {
			if (forceY > 0) {
				return 6 + index;
			} else {
				return 6 - index;
			}
		}
	}

	function getAngleIndex(index: number, direction: number): number {
		if (direction == 0) return index;
		return (((index + direction) % Angles.COUNT) + Angles.COUNT) % Angles.COUNT;
	}

	/**
	 * Simulate the positions of particles that are influencing each other.
	 * The particle  coordinates can only be from a given set of points.
	 * The simulation is run until the particles are stable.
	 * The particles are sorted by rank.
	 *
	 * In case of marker simulation the points represent the posible centers of the marker
	 * from which the marker angle can be calculated.
	 */
	export function updateAngleIndexes(item: Array<Item>): boolean {
		// Run simulation step
		let stable = true;

		for (let i = 0; i < item.length; i++) {
			const particle = item[i].particle;
			const influences = particle.neighbours;

			const index = particle.index;
			const x = particle.x;
			const y = particle.y;
			const distX = particle.distX;
			const distY = particle.distY;

			const prevIndex = getAngleIndex(index, -1);
			const nextIndex = getAngleIndex(index, +1);

			const prevPointX = x + distX * RADIANS_COS[prevIndex];
			const prevPointY = y + distY * RADIANS_SIN[prevIndex];
			const currPointX = x + distX * RADIANS_COS[index];
			const currPointY = y + distY * RADIANS_SIN[index];
			const nextPointX = x + distX * RADIANS_COS[nextIndex];
			const nextPointY = y + distY * RADIANS_SIN[nextIndex];

			let prevPointForce: number = 0;
			let currPointForce: number = 0;
			let nextPointForce: number = 0;

			for (let j = 0; j < influences.length; j++) {
				const particleI = influences[j];

				const xI = particleI.x;
				const yI = particleI.y;
				const distXI = particleI.distX;
				const distYI = particleI.distY;

				const indexI = particleI.index;
				const pointIx = xI + distXI * RADIANS_COS[indexI];
				const pointIy = yI + distYI * RADIANS_SIN[indexI];

				const prevDx = prevPointX - pointIx;
				const prevDy = prevPointY - pointIy;
				prevPointForce += 1 / (prevDx * prevDx + prevDy * prevDy);

				const currDx = currPointX - pointIx;
				const currDy = currPointY - pointIy;
				currPointForce += 1 / (currDx * currDx + currDy * currDy);

				const nextDx = nextPointX - pointIx;
				const nextDy = nextPointY - pointIy;
				nextPointForce += 1 / (nextDx * nextDx + nextDy * nextDy);
			}

			let direction = 0;
			// If minimal force is on the left, direction is left
			if (prevPointForce < currPointForce && prevPointForce < nextPointForce) direction = -1;
			// If minimal force is on the right, direction is right
			if (nextPointForce < currPointForce && nextPointForce < prevPointForce) direction = +1;

			if (direction != 0) {
				// Move particle point index in the direction of the minimal force
				particle.index = getAngleIndex(index, direction);
				// If at least one particle moved, the simulation is not stable
				stable = false;
			}
		}

		return stable;
	}

	export function initializeAngleIndexes(items: Array<Item>) {
		for (let i = 0; i < items.length; i++) {
			const particle = items[i].particle;
			const x = particle.x;
			const y = particle.y;

			let forceX: number = 0;
			let forceY: number = 0;

			for (let j = 0; j < items.length; j++) {
				const particleF = items[j].particle;
				const xF = particleF.x;
				const yF = particleF.y;

				const dx = x - xF;
				const dy = y - yF;
				if (dx == 0 && dy == 0) continue;

				const distance = Math.sqrt(dx * dx + dy * dy);
				const force = 1 / (distance * distance);

				// X axis is regular
				forceX += (force * dx) / distance;
				// Y axis is inverted
				forceY += -(force * dy) / distance;
			}

			particle.index = getAngleForceIndex(forceX, forceY);
		}
	}
}
