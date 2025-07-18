import { Angles } from '$lib/map/constants.js';

export namespace Simulation {
	export namespace Angle {
		export const RADIANS = Angles.DEGREES.map((d) => (d * Math.PI) / 180);
		export const RADIANS_COS = RADIANS.map((r) => Math.cos(r));
		export const RADIANS_SIN = RADIANS.map((r) => Math.sin(r));

		function getQuadrantIndex(forceX: number, forceY: number) {
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

		export function getAngleIndex(forceX: number, forceY: number) {
			const index = getQuadrantIndex(forceX, forceY);

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
	}

	export class Particle {
		/** The center of the particle. */
		center: { x: number; y: number };
		/** The width of the rectangle of possible positions of the particle. */
		width: number;
		/** The width of the rectangle of possible positions of the particle. */
		height: number;
		/** The index of the particle position in the points array. */
		index: number;

		constructor(center: { x: number; y: number }, width: number, height: number, index: number) {
			this.center = center;
			this.width = width;
			this.height = height;
			this.index = index;
		}
	}

	export interface Item {
		particle: Particle;
		influences: Particle[];
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
	export function updatePointIndexes(items: Array<Item>): boolean {
		// Run simulation step
		let stable = true;

		for (let i = 0; i < items.length; i++) {
			const { particle, influences } = items[i];

			const index = particle.index;
			const center = particle.center;
			const width = particle.width;
			const height = particle.height;

			const prevIndex = getIndex(index, -1);
			const nextIndex = getIndex(index, +1);

			const prevPointX = center.x + width * Angle.RADIANS_COS[prevIndex];
			const prevPointY = center.y + height * Angle.RADIANS_SIN[prevIndex];
			const currPointX = center.x + width * Angle.RADIANS_COS[index];
			const currPointY = center.y + height * Angle.RADIANS_SIN[index];
			const nextPointX = center.x + width * Angle.RADIANS_COS[nextIndex];
			const nextPointY = center.y + height * Angle.RADIANS_SIN[nextIndex];

			let prevPointForce: number = 0;
			let currPointForce: number = 0;
			let nextPointForce: number = 0;

			for (let j = 0; j < influences.length; j++) {
				const particleI = influences[j];
				const indexI = particleI.index;
				const centerI = particleI.center;
				const widthI = particleI.width;
				const heightI = particleI.height;
				const pointIx = centerI.x + widthI * Angle.RADIANS_COS[indexI];
				const pointIy = centerI.y + heightI * Angle.RADIANS_SIN[indexI];

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
				particle.index = getIndex(index, direction);
				// If at least one particle moved, the simulation is not stable
				stable = false;
			}
		}

		return stable;
	}

	export function initializePointIndexes(items: Array<Item>) {
		for (let i = 0; i < items.length; i++) {
			const { particle, influences } = items[i];
			const center = particle.center;

			let forceX: number = 0;
			let forceY: number = 0;

			for (let j = 0; j < influences.length; j++) {
				const particleI = influences[j];
				const centerI = particleI.center;

				const dx = center.x - centerI.x;
				const dy = center.y - centerI.y;
				if (dx == 0 && dy == 0) continue;

				const distance = Math.sqrt(dx * dx + dy * dy);
				const force = 1 / (distance * distance);

				// X axis is regular
				forceX += (force * dx) / distance;
				// Y axis is inverted
				forceY += -(force * dy) / distance;
			}

			particle.index = Angle.getAngleIndex(forceX, forceY);
		}
	}

	function getIndex(index: number, direction: number): number {
		if (direction == 0) return index;
		return (((index + direction) % Angles.COUNT) + Angles.COUNT) % Angles.COUNT;
	}
}
