import { getBounds, getBoundsZoomWhenTouching, areBoundsOverlaping, type Bounds } from './bounds.js';

import { MAP_MAX_ZOOM, MAP_MIN_ZOOM, MARKER_DEFAULT_ANGLE } from '../../constants.js';

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

	export interface Particle {
		/**
		 * The center of the particle.
		 * */
		center: Point;
		/**
		 * Points are possible positions of the particle.
		 */
		points: Array<Point>;
	}

	/**
	 * Get the points of the marker.
	 * The points are equally spaced around the center of the marker.
	 */
	export function getPoints(marker: Marker, scale: number): Array<Point> {
		const proprtion = 2;
		const radius = Math.min(marker.width, marker.height) / proprtion / scale;
		return Angles.RADIANS.map((r) => ({ x: marker.x + radius * Math.cos(r), y: marker.y + radius * Math.sin(r) }));
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
	export function updatePointIndexes(particles: Particle[]) {
		const indexes = new Array<number>(particles.length);

		// Initialze simulation
		// Particle indexes based on the center of the particles

		const center = getCenter(particles);

		for (let i = 0; i < particles.length; i++) {
			const particleI = particles[i];
			const centerI = particleI.center;

			const dx = centerI.x - center.x;
			const dy = centerI.y - center.y;

			indexes[i] = Angles.getAngleIndex(dx, dy);
		}

		// Run simulation
		// Wait until all particles are stable or the simulation is stuck

		let stable = false;
		let set = new Set<string>();

		while (!stable) {
			stable = true;

			for (let i = 0; i < particles.length; i++) {
				const particle = particles[i];
				const index = indexes[i];

				const prevPoint = particle.points[getIndex(index, -1)];
				const currPoint = particle.points[index];
				const nextPoint = particle.points[getIndex(index, +1)];

				let prevPointForce: number = 0;
				let currPointForce: number = 0;
				let nextPointForce: number = 0;

				for (let j = 0; j < particles.length; j++) {
					if (i === j) continue;

					const particleF = particles[j];
					const indexF = indexes[i];
					const pointF = particleF.points[indexF];

					const prevDx = prevPoint.x - pointF.x;
					const prevDy = prevPoint.y - pointF.y;
					prevPointForce += 1 / (prevDx * prevDx + prevDy * prevDy);

					const currDx = currPoint.x - pointF.x;
					const currDy = currPoint.y - pointF.y;
					currPointForce += 1 / (currDx * currDx + currDy * currDy);

					const nextDx = nextPoint.x - pointF.x;
					const nextDy = nextPoint.y - pointF.y;
					nextPointForce += 1 / (nextDx * nextDx + nextDy * nextDy);
				}

				let direction = 0;
				// If minimal force is on the left, direction is left
				if (prevPointForce < currPointForce && prevPointForce < nextPointForce) direction = -1;
				// If minimal force is on the right, direction is right
				if (nextPointForce < currPointForce && nextPointForce < prevPointForce) direction = +1;

				// Move particle point index in the direction of the minimal force
				indexes[i] = getIndex(index, direction);

				// If at least one particle moved, the simulation is not stable
				if (direction !== 0) stable = false;
			}

			const setId = indexes.join('-');
			if (set.has(setId)) break;
			set.add(setId);
		}

		return indexes;
	}

	function getCenter(particles: Particle[]): Point {
		if (particles?.length === 0) {
			return { x: 0, y: 0 };
		}

		let centerX = 0;
		let centerY = 0;

		for (const particle of particles) {
			centerX += particle.center.x;
			centerY += particle.center.y;
		}

		centerX /= particles.length;
		centerY /= particles.length;

		return { x: centerX, y: centerY };
	}

	function getIndex(index: number, direction: number): number {
		if (direction == 0) return index;
		return (((index + direction) % Angles.COUNT) + Angles.COUNT) % Angles.COUNT;
	}
}

namespace Nodes {
	export interface Node {
		/** The marker that this node represents. */
		marker: Marker;
		/** State of the marker expanded or not. */
		expanded: boolean;
		/** The angle of the marker node. */
		angle: number;
		/** A marker node has a particle whose position is used to calculate the angle */
		particle: Particles.Particle;
	}

	export interface Connection {
		/** The zoom when bounds of influence are touching,
		 *  used to filter out connections that are not influencing the marker nodes. */
		zwt: number;
		/** The marker nodes that are influencing each other. */
		node1: Node;
		node2: Node;
	}

	export interface Layer {
		/** The zoom level of the layer */
		zoom: number;
		/** The connections of the layer */
		connections: Array<Connection>;
	}

	export function createNodes(markers: Array<Marker>): Array<Node> {
		let nodes = new Array<Node>(markers.length);

		// Create marker nodes
		for (let i = 0; i < markers.length; i++) {
			const marker = markers[i];
			nodes[i] = {
				marker: marker,
				expanded: true,
				angle: Particles.Angles.DEFAULT,
				particle: {
					center: { x: marker.x, y: marker.y },
					points: Particles.getPoints(marker, 1)
				}
			};
		}

		return nodes;
	}

	export function createConnections(nodes: Node[]): Array<Connection> {
		const connections = new Array<Connection>();

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

			for (let i2 = i1 + 1; i2 < nodes.length; i2++) {
				const node2 = nodes[i2];
				const bounds2 = bounds[i2];

				const zwt = getBoundsZoomWhenTouching(bounds1, bounds2);
				connections.push({ zwt, node1, node2 });
			}
		}

		return connections;
	}

	export function createLayers(connections: Connection[]): Array<Layer> {
		const layers = new Array<Layer>();

		// Create layers
		for (let zoom = Zoom.MIN; zoom <= Zoom.MAX; zoom = Zoom.addSteps(zoom, 1)) {
			layers.push({
				zoom: zoom,
				connections: []
			});
		}

		// Add connections to layers
		for (let i = 0; i < connections.length; i++) {
			const connection = connections[i];
			const zwt = connection.zwt;

			for (let j = 0; j < layers.length; j++) {
				const layer = layers[j];
				if (zwt <= layer.zoom) break;

				layer.connections.push(connection);
			}
		}

		return layers;
	}

	export function getExpandedConnections(layers: Layer[], zoom: number): Array<Connection> {
		const layer = layers.find((l) => l.zoom == zoom);
		if (!layer) throw new Error('Layer not found');
		return layer.connections.filter((c) => c.node1.expanded && c.node2.expanded);
	}

	export function getNodeGraphs(connections: Array<Connection>): Array<Set<Node>> {
		const graphs = new Array<Set<Node>>();

		for (let i = 0; i < connections.length; i++) {
			const connection = connections[i];
			const node1 = connection.node1;
			const node2 = connection.node2;

			// Try to find the graphs of the nodes
			let graph1: Set<Node> | undefined = undefined;
			let graph2: Set<Node> | undefined = undefined;

			for (let i = 0; i < graphs.length; i++) {
				const graph = graphs[i];
				if (graph.has(node1)) graph1 = graph;
				if (graph.has(node2)) graph2 = graph;
			}

			// Both nodes are in separate graphs
			if (graph1 != undefined && graph2 != undefined) {
				if (graph1 != graph2) {
					graph2.forEach((n) => graph1.add(n));
					graphs.splice(graphs.indexOf(graph2), 1);
				}
				continue;
			}

			// One node is in a graph, the other is not
			if (graph1 != undefined && graph2 == undefined) {
				if (node2.expanded) graph1.add(node2);
				continue;
			}

			if (graph1 == undefined && graph2 != undefined) {
				if (node1.expanded) graph2.add(node1);
				continue;
			}

			// Neither node is in a graph
			const graph = new Set<Node>();
			if (node1.expanded) graph.add(node1);
			if (node2.expanded) graph.add(node2);
			graphs.push(graph);
		}

		return graphs;
	}

	export function getAngles(nodes: Array<Node>): Array<number> {
		if (nodes.length == 1) return [Particles.Angles.DEFAULT];

		const indexes = Particles.updatePointIndexes(nodes.map((m) => m.particle));
		const angles = indexes.map((i) => Particles.Angles.DEGREES[i]);

		return angles;
	}

	export function getOverlapingNodeIndex(nodes: Array<Node>, scale: number) {
		const overlaps = new Array<Array<Node>>();
		const bounds = new Array<Bounds>(nodes.length);

		for (let i = 0; i < nodes.length; i++) {
			const node1 = nodes[i];
			const bounds1 = getBounds(node1.marker, node1.angle, scale);

			bounds[i] = bounds1;

			for (let j = 0; j < i; j++) {
				const bounds2 = bounds[j];

				if (areBoundsOverlaping(bounds2, bounds1)) {
					const node2 = nodes[j];

					if (overlaps[i] == undefined) overlaps[i] = [node2];
					else overlaps[i].push(node2);

					if (overlaps[j] == undefined) overlaps[j] = [node1];
					else overlaps[j].push(node1);
				}
			}
		}

		let worstNodeIndex = -1;
		let worstScore = 0;

		for (let j = 0; j < overlaps.length; j++) {
			const node = nodes[j];
			const nodesOverlaping = overlaps[j];
			if (nodesOverlaping == undefined) continue;

			const score = nodesOverlaping.reduce((s, n) => s + (n.marker.rank - node.marker.rank), 0);

			if (worstNodeIndex == undefined || score > worstScore) {
				worstNodeIndex = j;
				worstScore = score;
			}
		}

		return worstNodeIndex;
	}

	export function updateNodeParticles(nodes: Array<Node>, scale: number) {
		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i];
			node.particle.points = Particles.getPoints(node.marker, scale);
		}
	}

	export function updateNodeAngles(nodes: Array<Node>) {
		if (nodes.length == 1) {
			nodes[0].angle = Particles.Angles.DEFAULT;
			return;
		}

		const indexes = Particles.updatePointIndexes(nodes.map((m) => m.particle));

		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i];
			node.angle = Particles.Angles.DEGREES[indexes[i]];
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
			zoom: zoom,
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
	let thresholds = new Array<Threshold.Event>();

	// Initialze nodes
	const nodes = Nodes.createNodes(markers);
	const connections = Nodes.createConnections(nodes);
	const layers = Nodes.createLayers(connections);

	// Initialize zoom
	const maxZoom = layers.at(-1)?.zoom ?? MAP_MAX_ZOOM;
	const minZoom = MAP_MIN_ZOOM;

	// Initially add the last threshold event
	thresholds.push(Threshold.createEvent(nodes, Zoom.addSteps(maxZoom, 1)));

	// Go from last to first zoom
	for (let zoom = maxZoom; zoom >= minZoom; zoom = Zoom.addSteps(zoom, -1)) {
		// Calculate scale
		const scale = Math.pow(2, zoom);

		// Get connections of expaneded nodes from a layer
		const expandedConnections = Nodes.getExpandedConnections(layers, zoom);
		// Get the graphs of expanded markers influencing each other
		const expandedNodeGraphs = Nodes.getNodeGraphs(expandedConnections);

		for (let i = 0; i < expandedNodeGraphs.length; i++) {
			// Get the array of expanded nodes from graph
			let nodeArray = Array.from(expandedNodeGraphs[i]).toSorted((p1, p2) => p1.marker.rank - p2.marker.rank);

			// Update nodes particles for the given zoom level
			Nodes.updateNodeParticles(nodeArray, scale);

			while (nodeArray.length > 1) {
				// Update nodes angles
				Nodes.updateNodeAngles(nodeArray);

				// Get the index of the overlaping node
				// If there is an no overlaping node break
				let overlapingNodeIndex = Nodes.getOverlapingNodeIndex(nodeArray, scale);
				if (overlapingNodeIndex == -1) break;

				// Else, collapse it
				// and remove it from the array and try again
				nodeArray[overlapingNodeIndex].expanded = false;
				nodeArray.splice(overlapingNodeIndex, 1);
			}
		}

		// Get the expanded nodes
		const expandedNodes = nodes.filter((n) => n.expanded);
		// Create threshold event
		thresholds.push(Threshold.createEvent(expandedNodes, zoom));
	}

	//  Return the thresholds in reverse order (from min zoom to max zoom)
	return thresholds.reverse();
}

export { getThresholds };
