import { getBounds, getBoundsZoomWhenTouching, areBoundsOverlaping, type Bounds } from './bounds.js';

import { MAP_MAX_ZOOM, MAP_MIN_ZOOM, MARKER_DEFAULT_ANGLE } from '../../constants.js';

interface Marker {
	id: string;
	x: number;
	y: number;
	width: number;
	height: number;
	rank: number;
}

namespace Particles {
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

	/**
	 * Get the points of the marker.
	 * The points are equally spaced around the center of the marker.
	 */
	export function getRadius(marker: Marker, scale: number): number {
		const proprtion = 2;
		const radius = Math.min(marker.width, marker.height) / proprtion / scale;
		return radius;
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

namespace Nodes {
	export interface Node {
		/** The index of the node in the nodes array. */
		index: number;
		/** The marker that this node represents. */
		marker: Marker;
		/** State of the marker expanded or not. */
		expanded: boolean;
		/** The angle of the marker node. */
		angle: number;
		/** The bounds of the marker node. */
		bounds: Bounds;
		/** A marker node has a particle whose position is used to calculate the angle */
		particle: Particles.Particle;
		/** The neighbours of the marker node. */
		neighbours: Array<Node>;
	}

	export type NodeNeighbourDeltas = Array<Array<Array<Node>>>;

	export function createNodes(markers: Array<Marker>): Array<Node> {
		let nodes = new Array<Node>(markers.length);

		// Create marker nodes
		for (let i = 0; i < markers.length; i++) {
			const marker = markers[i];
			nodes[i] = {
				index: i,
				marker: marker,
				expanded: true,
				angle: Particles.Angles.DEFAULT,
				bounds: getBounds(marker, Particles.Angles.DEFAULT, 1),
				particle: {
					center: { x: marker.x, y: marker.y },
					radius: Particles.getRadius(marker, 1),
					index: Particles.Angles.DEGREES.indexOf(Particles.Angles.DEFAULT)
				},
				neighbours: new Array<Node>()
			};
		}

		return nodes;
	}

	export function createNeighbourDeltas(nodes: Array<Node>): NodeNeighbourDeltas {
		// Create array of neighbours deltas for each node
		// at each zoom level
		const nodesNeighbourDeltas = new Array<Array<Array<Node>>>();

		for (let i = 0; i < nodes.length; i++) {
			nodesNeighbourDeltas[i] = new Array<Array<Node>>();
		}

		// Create marker connection bounds of influence,
		// bounds are the maximum rectangle where the marker can be positioned
		const bounds = new Array<Bounds>(nodes.length);

		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i];
			const marker = node.marker;

			bounds[i] = {
				x: marker.x,
				y: marker.y,
				left: marker.width,
				right: marker.width,
				top: marker.height,
				bottom: marker.height
			};
		}

		// Calculate marker connections zoom when touching,
		// the zoom when touching is the maximum zoom level at
		// which the markers influencing each others position (angle, expanded, etc.)
		for (let i1 = 0; i1 < nodes.length; i1++) {
			const node1 = nodes[i1];
			const bounds1 = bounds[i1];
			const neighboursDeltas1 = nodesNeighbourDeltas[i1];

			for (let i2 = i1 + 1; i2 < nodes.length; i2++) {
				const node2 = nodes[i2];
				const bounds2 = bounds[i2];
				const neighboursDeltas2 = nodesNeighbourDeltas[i2];

				const zwt = getBoundsZoomWhenTouching(bounds1, bounds2);
				const zoom = Zoom.getZoomIndex(zwt);

				const zoomNeighbourDelta1 = neighboursDeltas1[zoom];
				const zoomNeighbourDelta2 = neighboursDeltas2[zoom];

				if (zoomNeighbourDelta1) zoomNeighbourDelta1.push(node2);
				else neighboursDeltas1[zoom] = [node2];

				if (zoomNeighbourDelta2) zoomNeighbourDelta2.push(node1);
				else neighboursDeltas2[zoom] = [node1];
			}
		}

		return nodesNeighbourDeltas;
	}

	export function getNeighbourGraphs(nodes: Array<Node>): Array<Array<Node>> {
		const visited = new Set<Node>();
		const graphs: Node[][] = [];

		for (let i = 0; i < nodes.length; i++) {
			let node = nodes[i];
			if (node.expanded == false) continue;
			if (node.neighbours.length == 0) continue;

			if (visited.has(node)) continue;
			visited.add(node);

			const graph: Node[] = [];
			const stack: Node[] = [node];

			while (stack.length > 0) {
				const stackNode = stack.pop()!;
				graph.push(stackNode);

				for (const neighbour of stackNode.neighbours) {
					if (visited.has(neighbour)) continue;

					visited.add(neighbour);
					stack.push(neighbour);
				}
			}

			graphs.push(graph);
		}

		return graphs;
	}

	export function updateNeighbours(nodes: Array<Node>, nodesNeighbourDeltas: NodeNeighbourDeltas, zoomIndex: number) {
		for (let i = 0; i < nodes.length; i++) {
			let node = nodes[i];

			// If the node is not expanded, clear neighbours
			if (node.expanded == false) {
				node.neighbours.length = 0;
				continue;
			}

			// Else, add neighbours based on delta at zoom level
			const nodeNeighbourDeltas = nodesNeighbourDeltas[i];
			const zoomNeighbourDelta = nodeNeighbourDeltas[zoomIndex];
			if (zoomNeighbourDelta == undefined) continue;

			for (let j = 0; j < zoomNeighbourDelta.length; j++) {
				const neighbour = zoomNeighbourDelta[j];
				if (neighbour.expanded == false) continue;

				node.neighbours.push(neighbour);
			}
		}
	}

	export function updateCollapsed(node: Node) {
		// Set node expanded to false
		node.expanded = false;

		// Remove node from neighbours
		const nodeNeighbours = node.neighbours;
		for (let i = 0; i < nodeNeighbours.length; i++) {
			const neighbour = nodeNeighbours[i];
			const neighbourNodeIndex = neighbour.neighbours.indexOf(node);
			neighbour.neighbours.splice(neighbourNodeIndex, 1);
		}
	}

	export namespace Bounds {
		export function updateBounds(nodes: Array<Node>, scale: number) {
			for (let i = 0; i < nodes.length; i++) {
				const node = nodes[i];
				node.bounds = getBounds(node.marker, node.angle, scale);
			}
		}

		export function getOverlaping(nodes: Array<Node>, scale: number): boolean {
			for (let i = 0; i < nodes.length; i++) {
				const node1 = nodes[i];
				const bounds1 = node1.bounds;
				const neighbours1 = nodes[i].neighbours;

				for (let j = 0; j < neighbours1.length; j++) {
					const node2 = neighbours1[j];
					const bounds2 = node2.bounds;

					if (areBoundsOverlaping(bounds2, bounds1)) {
						return true;
					}
				}
			}

			return false;
		}

		export function getOverlapingIndex(nodes: Array<Node>, scale: number): number {
			let worstNodeIndex = -1;
			let worstScore = 0;

			for (let i = 0; i < nodes.length; i++) {
				const node1 = nodes[i];
				const bounds1 = node1.bounds;
				const neighbours1 = nodes[i].neighbours;

				let score = 0;

				for (let j = 0; j < neighbours1.length; j++) {
					const node2 = neighbours1[j];
					const bounds2 = node2.bounds;

					if (areBoundsOverlaping(bounds2, bounds1)) {
						score += 1 + node2.marker.rank - node1.marker.rank;
					}
				}

				if (score > worstScore) {
					worstScore = score;
					worstNodeIndex = i;
				}
			}

			return worstNodeIndex;
		}
	}

	export namespace Simulation {
		let stable = false;

		export function getStable() {
			return stable;
		}

		export function updateParticles(nodes: Array<Node>, scale: number) {
			for (let i = 0; i < nodes.length; i++) {
				const node = nodes[i];
				node.particle.radius = Particles.getRadius(node.marker, scale);
			}
		}

		export function updateAngles(nodes: Array<Node>) {
			stable = Particles.updatePointIndexes(nodes.map((n) => [n.particle, n.neighbours.map((n) => n.particle)]));

			for (let i = 0; i < nodes.length; i++) {
				const node = nodes[i];
				node.angle = Particles.Angles.DEGREES[node.particle.index];
			}
		}
	}

	export namespace Zoom {
		export const MIN = MAP_MIN_ZOOM;
		export const MAX = MAP_MAX_ZOOM;

		export const SCALE = 10;
		export const STEP = 1 / SCALE;

		export function addSteps(zoom: number, count: number) {
			return Math.round((zoom + count * STEP) * SCALE) / SCALE;
		}

		export function getZoomIndex(zwt: number) {
			return Math.min(Math.ceil(zwt * SCALE), MAX * SCALE);
		}

		export function getZoomMax(nodesNeighbourDeltas: Nodes.NodeNeighbourDeltas): number {
			let zoom = MIN;

			for (let i = 0; i < nodesNeighbourDeltas.length; i++) {
				const nodeNeighbourDeltas = nodesNeighbourDeltas[i];
				const nodeNeighbourDeltasZoomKeys = nodeNeighbourDeltas.keys();

				for (const zoomKey of nodeNeighbourDeltasZoomKeys) {
					const zoomValue = Number(zoomKey) / Zoom.SCALE;
					if (zoomValue > zoom) zoom = zoomValue;
				}
			}

			return zoom;
		}
	}
}

namespace Threshold {
	export class Event {
		/** The zoom threshold */
		zoom: number;
		/** The expanded markers */
		ids: Array<string>;
		/** The angles of all the markers after the zoom expand threshold */
		angles: Array<{ id: string; value: number }>;

		constructor(nodes: Nodes.Node[], zoom: number) {
			this.zoom = Number(zoom.toFixed(1));
			this.ids = nodes.map((n) => n.marker.id);
			this.angles = nodes.map((n) => ({ id: n.marker.id, value: n.angle }));
		}
	}
}

/**
 * Create marker nodes, all expanded initially
 * Calculate zooms when touching bounds of influence for markers
 * From max zoom to min zoom in steps, get graphs of expanded markers influencing each other
 * Foreach graph:
 *   get best fit angles of marker particles
 *   get all overlaping bounds
 *   based on number of overlaps and rank, collapse a node and recalculate graphs
 * Add threshold event
 * If only one node expanded left, break
 */
function getThresholds(markers: Array<Marker>): Array<Threshold.Event> {
	const thresholds = new Array<Threshold.Event>();

	console.log('EEEE');

	// Initialze nodes
	const nodes = Nodes.createNodes(markers);
	const nodeNeighbourDeltas = Nodes.createNeighbourDeltas(nodes);

	// Initialize zoom
	const maxZoom = Nodes.Zoom.getZoomMax(nodeNeighbourDeltas);
	const minZoom = Nodes.Zoom.MIN;

	// Initially add the last threshold event
	thresholds.push(new Threshold.Event(nodes, Nodes.Zoom.addSteps(maxZoom, 1)));

	// Go from last to first zoom
	for (let zoom = maxZoom; zoom >= minZoom; zoom -= Nodes.Zoom.STEP) {
		// Calculate scale
		const zoomScale = Math.pow(2, zoom);
		const zoomIndex = Math.round(zoom * Nodes.Zoom.SCALE);

		// Update expanded nodes neighbours
		Nodes.updateNeighbours(nodes, nodeNeighbourDeltas, zoomIndex);
		// Get expanded node graphs
		const graphs = Nodes.getNeighbourGraphs(nodes);

		for (let i = 0; i < graphs.length; i++) {
			const graph = graphs[i];

			// Update node bounds
			Nodes.Bounds.updateBounds(graph, zoomScale);
			// Check if there are overlaping nodes in graph
			if (Nodes.Bounds.getOverlaping(graph, zoomScale) == false) continue;

			// Initialize the simulation for a given zoom level
			Nodes.Simulation.updateParticles(graph, zoomScale);

			// Remove some overlaping nodes from the array
			// until there is no overlaping nodes
			while (true) {
				// Run the simulation loop
				// to update the angles of the nodes
				while (true) {
					// Update node angles in the simulation
					Nodes.Simulation.updateAngles(graph);
					// Update node bounds
					Nodes.Bounds.updateBounds(graph, zoomScale);

					// Check if the last simulation update was stable
					if (Nodes.Simulation.getStable()) break;
					// Or there are overlaping nodes
					if (Nodes.Bounds.getOverlaping(graph, zoomScale) == false) break;
				}

				// Get the index of the overlaping node
				// If there is an no overlaping node break
				const collapsedNodeIndex = Nodes.Bounds.getOverlapingIndex(graph, zoomScale);
				if (collapsedNodeIndex == -1) break;

				// Else, collapse it
				Nodes.updateCollapsed(graph[collapsedNodeIndex]);

				// And remove it from the array
				// and try again if there is more than one node
				graph.splice(collapsedNodeIndex, 1);
				if (graph.length == 1) break;
			}
		}

		// Create threshold event with the expanded nodes
		const expandedNodes = nodes.filter((n) => n.expanded);
		thresholds.push(new Threshold.Event(expandedNodes, zoom));
	}

	//  Return the thresholds in reverse order (from min zoom to max zoom)
	return thresholds.reverse();
}

export { getThresholds };
