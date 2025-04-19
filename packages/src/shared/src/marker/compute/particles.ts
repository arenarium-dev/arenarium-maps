import { MARKER_DEFAULT_ANGLE } from '../../constants';

export namespace Particles {
	export namespace Angles {
		export const COUNT = 12;
		export const DEFAULT = MARKER_DEFAULT_ANGLE;
		export const DEGREES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
		export const RADIANS = DEGREES.map((d) => (d * Math.PI) / 180);
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
					return 0 + index;
				} else {
					return (12 - index) % 12;
				}
			} else {
				if (forceY > 0) {
					return 6 - index;
				} else {
					return 6 + index;
				}
			}
		}
	}

	export class Particle {
		/** The center of the particle. */
		center: Point;
		/** The radius of the circle of possible positions of the particle. */
		radius: number;
		/** The index of the particle position in the points array. */
		index: number;

		constructor(center: Point, radius: number, index: number) {
			this.center = center;
			this.radius = radius;
			this.index = index;
		}
	}

	export class Point {
		x: number;
		y: number;

		constructor(particle: Particle, index: number) {
			const center = particle.center;
			const radius = particle.radius;
			const angle = Angles.RADIANS[index];
			this.x = center.x + radius * Math.cos(angle);
			this.y = center.y + radius * Math.sin(angle);
		}
	}

	export function getIndex(index: number, direction: number): number {
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
	export function updatePointIndexes(data: [Particle, Particle[]][]) {
		// Run simulation step
		let stable = true;

		for (let i = 0; i < data.length; i++) {
			const [particle, particleForces] = data[i];
			const index = particle.index;
			const center = particle.center;
			const radius = particle.radius;

			const prevIndex = getIndex(index, -1);
			const nextIndex = getIndex(index, +1);

			const prevPointX = center.x + radius * Angles.RADIANS_COS[prevIndex];
			const prevPointY = center.y + radius * Angles.RADIANS_SIN[prevIndex];
			const currPointX = center.x + radius * Angles.RADIANS_COS[index];
			const currPointY = center.y + radius * Angles.RADIANS_SIN[index];
			const nextPointX = center.x + radius * Angles.RADIANS_COS[nextIndex];
			const nextPointY = center.y + radius * Angles.RADIANS_SIN[nextIndex];

			let prevPointForce: number = 0;
			let currPointForce: number = 0;
			let nextPointForce: number = 0;

			for (let j = 0; j < particleForces.length; j++) {
				const fParticle = particleForces[j];
				const fIndex = fParticle.index;
				const fCenter = fParticle.center;
				const fRadius = fParticle.radius;

				const fPointX = fCenter.x + fRadius * Angles.RADIANS_COS[fIndex];
				const fPointY = fCenter.y + fRadius * Angles.RADIANS_SIN[fIndex];

				const prevDx = prevPointX - fPointX;
				const prevDy = prevPointY - fPointY;
				prevPointForce += 1 / (prevDx * prevDx + prevDy * prevDy);

				const currDx = currPointX - fPointX;
				const currDy = currPointY - fPointY;
				currPointForce += 1 / (currDx * currDx + currDy * currDy);

				const nextDx = nextPointX - fPointX;
				const nextDy = nextPointY - fPointY;
				nextPointForce += 1 / (nextDx * nextDx + nextDy * nextDy);
			}

			let direction = 0;
			// If minimal force is on the left, direction is left
			if (prevPointForce < currPointForce && prevPointForce < nextPointForce) direction = -1;
			// If minimal force is on the right, direction is right
			if (nextPointForce < currPointForce && nextPointForce < prevPointForce) direction = +1;

			// Move particle point index in the direction of the minimal force
			particle.index = getIndex(index, direction);

			// If at least one particle moved, the simulation is not stable
			if (direction !== 0) stable = false;
		}

		return stable;
	}
}
