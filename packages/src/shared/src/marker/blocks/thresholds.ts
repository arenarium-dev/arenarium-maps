import { getBounds, getBoundsZoomWhenTouching, areBoundsOverlaping, type Bounds } from './bounds.js';

import { MAP_MAX_ZOOM, MAP_MIN_ZOOM, MARKER_DEFAULT_ANGLE } from '../../constants.js';
import { Timer } from '../../utils.js';

interface Point {
	x: number;
	y: number;
}

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

	export interface Connection {
		/** The zoom when bounds of influence are touching,
		 *  used to filter out connections that are not influencing the marker nodes. */
		zwt: number;
		/** The enabled state of the connection. True if both nodes are expanded. */
		enabled: boolean;
	}

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

	export function createConnections(nodes: Array<Node>): Array<Array<Connection>> {
		// Create array of connections for each node
		const connections = new Array<Array<Connection>>(nodes.length);
		for (let i = 0; i < nodes.length; i++) {
			connections[i] = new Array<Connection>(nodes.length);
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
			const bounds1 = bounds[i1];

			for (let i2 = i1 + 1; i2 < nodes.length; i2++) {
				const bounds2 = bounds[i2];

				const zwt = getBoundsZoomWhenTouching(bounds1, bounds2);
				const connection = { zwt: zwt, enabled: true };

				connections[i1][i2] = connection;
				connections[i2][i1] = connection;
			}

			// Disable self connection
			connections[i1][i1] = { zwt: 0, enabled: false };
		}

		return connections;
	}

	export function getNeighbourhood(nodes: Array<Node>, connections: Array<Array<Connection>>, zoom: number): Array<Node> {
		const nodesWithNeighbours = new Array<Nodes.Node>();

		// Update node neighbours
		for (let i = 0; i < nodes.length; i++) {
			let node = nodes[i];
			// If the node is not expanded, skip
			if (node.expanded == false) continue;

			// Get node neighbours
			let nodeNeighbours = new Array<Node>();
			let nodeConnections = connections[i];

			for (let i = 0; i < nodeConnections.length; i++) {
				const connection = nodeConnections[i];
				if (connection.enabled == false) continue;
				if (connection.zwt <= zoom) continue;

				nodeNeighbours.push(nodes[i]);
			}

			// If there are no neighbours, skip
			if (nodeNeighbours.length == 0) continue;

			node.neighbours = nodeNeighbours;
			nodesWithNeighbours.push(node);
		}

		return nodesWithNeighbours;
	}

	export function getNeighbourGraphs(nodes: Array<Node>): Array<Array<Node>> {
		const visited = new Set<Node>();
		const graphs: Node[][] = [];

		for (const node of nodes) {
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

	export function updateNodeBounds(nodes: Array<Node>, scale: number) {
		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i];
			node.bounds = getBounds(node.marker, node.angle, scale);
		}
	}

	export function setNodeCollapsed(node: Node, connections: Array<Connection>) {
		node.expanded = false;

		for (let j = 0; j < connections.length; j++) {
			connections[j].enabled = false;
		}
	}

	export namespace Bounds {
		export function areOverlaping(nodes: Array<Node>, scale: number): boolean {
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
						score += node2.marker.rank - node1.marker.rank;
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
		export function updateParticles(nodes: Array<Node>, scale: number) {
			for (let i = 0; i < nodes.length; i++) {
				const node = nodes[i];
				node.particle.radius = Particles.getRadius(node.marker, scale);
			}
		}

		export function updateAngles(nodes: Array<Node>) {
			const stable = Particles.updatePointIndexes(nodes.map((n) => [n.particle, n.neighbours.map((n) => n.particle)]));

			for (let i = 0; i < nodes.length; i++) {
				const node = nodes[i];
				node.angle = Particles.Angles.DEGREES[node.particle.index];
			}

			return stable;
		}
	}
}

namespace Zoom {
	export const MIN = MAP_MIN_ZOOM;
	export const MAX = MAP_MAX_ZOOM;

	export const SCALE = 10;
	export const STEP = 1 / SCALE;

	export function addSteps(zoom: number, count: number) {
		return Math.round((zoom + count * STEP) * SCALE) / SCALE;
	}

	export function getMaxZoom(connectionsGrid: Array<Array<Nodes.Connection>>): number {
		let zoom = Zoom.MIN;

		for (let i = 0; i < connectionsGrid.length; i++) {
			const connectionArray = connectionsGrid[i];

			for (let j = 0; j < connectionArray.length; j++) {
				const connection = connectionArray[j];
				if (connection.zwt > zoom) {
					zoom = connection.zwt;
				}

				if (zoom > Zoom.MAX) {
					return Zoom.MAX;
				}
			}
		}

		return addSteps(zoom - (zoom % Zoom.STEP), 0);
	}
}

namespace Threshold {
	export interface Event {
		/** The zoom threshold */
		zoom: number;
		/** The expanded markers */
		ids: Array<string>;
		/** The angles of all the markers after the zoom expand threshold */
		angles: Array<{ id: string; value: number }>;
	}

	export function createEvent(nodes: Nodes.Node[], zoom: number): Event {
		return {
			zoom: Number(zoom.toFixed(1)),
			ids: nodes.map((n) => n.marker.id),
			angles: nodes.map((n) => ({ id: n.marker.id, value: n.angle }))
		};
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

	const timer = new Timer();

	// Initialze nodes
	const nodes = timer.time(() => Nodes.createNodes(markers), 'create nodes');
	const connections = timer.time(() => Nodes.createConnections(nodes), 'create connections');

	// Initialize zoom
	const maxZoom = timer.time(() => Zoom.getMaxZoom(connections), 'get max zoom');
	const minZoom = Zoom.MIN;

	// Initially add the last threshold event
	thresholds.push(Threshold.createEvent(nodes, Zoom.addSteps(maxZoom, 1)));

	// Go from last to first zoom
	for (let zoom = maxZoom; zoom >= minZoom; zoom -= Zoom.STEP) {
		// Calculate scale
		const scale = Math.pow(2, zoom);

		// Get nodes with neighbours
		const nodeNeighbourhood = timer.time(() => Nodes.getNeighbourhood(nodes, connections, zoom), 'get node neighbourhood');
		// Get node graphs
		const nodeGraphs = timer.time(() => Nodes.getNeighbourGraphs(nodeNeighbourhood), 'get node graphs');

		for (let i = 0; i < nodeGraphs.length; i++) {
			let nodeGraph = nodeGraphs[i];

			// Update node bounds
			timer.time(() => Nodes.updateNodeBounds(nodeGraph, scale), 'set node bounds');

			// Check if there are overlaping nodes in graph
			let nodeGraphOverlaping = timer.time(() => Nodes.Bounds.areOverlaping(nodeGraph, scale), 'overlaping nodes');
			if (nodeGraphOverlaping == false) continue;

			// Remove some overlaping nodes from the array
			// until there is no overlaping nodes
			while (nodeGraph.length > 1) {
				// Initialize the simulation for a given zoom level
				timer.time(() => Nodes.Simulation.updateParticles(nodeGraph, scale), 'simulation init');

				while (true) {
					// Run the loop until the simulation is stable
					let nodeSimulationStable = timer.time(() => Nodes.Simulation.updateAngles(nodeGraph), 'simulation update');
					if (nodeSimulationStable) break;

					// Update node bounds
					timer.time(() => Nodes.updateNodeBounds(nodeGraph, scale), 'set node bounds');

					// Or there are overlaping nodes
					let nodeSimulationOverlaping = timer.time(() => Nodes.Bounds.areOverlaping(nodeGraph, scale), 'overlaping nodes');
					if (nodeSimulationOverlaping == false) break;
				}

				// Get the index of the overlaping node
				// If there is an no overlaping node break
				let overlapingNodeIndex = timer.time(() => Nodes.Bounds.getOverlapingIndex(nodeGraph, scale), 'overlaping index');
				if (overlapingNodeIndex == -1) break;

				// Else, collapse it
				const collapsedNode = nodeGraph[overlapingNodeIndex];
				timer.time(() => Nodes.setNodeCollapsed(collapsedNode, connections[collapsedNode.index]), 'set node collapsed');

				// and remove it from the array and try again
				nodeGraph[overlapingNodeIndex].expanded = false;
				nodeGraph.splice(overlapingNodeIndex, 1);
			}
		}

		// Get the expanded nodes
		const expandedNodes = nodes.filter((n) => n.expanded);
		// Create threshold event
		thresholds.push(Threshold.createEvent(expandedNodes, zoom));
	}

	timer.print(`[THRESHOLDS ${markers.length}]`);

	//  Return the thresholds in reverse order (from min zoom to max zoom)
	return thresholds.reverse();
}

export { getThresholds };
