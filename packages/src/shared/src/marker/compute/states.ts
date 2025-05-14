import { getRectangleOffsets } from '../rectangle.js';
import { Particles } from './particles.js';
import { getBoundsZoomWhenTouching, areBoundsOverlaping, type Bounds } from './bounds.js';
import { getPoint } from '../projection.js';
import { MAP_MAX_ZOOM, MAP_MIN_ZOOM, MAP_ZOOM_SCALE, MARKER_DEFAULT_ANGLE, MARKER_PADDING } from '../../constants.js';
import { type Popup } from '../../types.js';

namespace Nodes {
	export class Marker {
		zoomAfterExpanded: number;
		zoomAfterAngles: [number, number][];

		constructor() {
			this.zoomAfterExpanded = NaN;
			this.zoomAfterAngles = [];
		}
	}

	export class Node {
		// PROPERTIES
		/** The index of the node in the nodes array. */
		index: number;
		/** The id of the marker that this node represents. */
		id: string;
		/** The rank of the marker node. */
		rank: number;
		/** The x coordinate of the marker node. */
		x: number;
		/** The y coordinate of the marker node. */
		y: number;
		/** The width of the marker node. */
		width: number;
		/** The height of the marker node. */
		height: number;

		// STATE
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

		constructor(data: Popup.Data, index: number) {
			const projection = getPoint(data.lat, data.lng);
			const width = data.width + 3 * MARKER_PADDING;
			const height = data.height + 3 * MARKER_PADDING;

			this.index = index;
			this.id = data.id;
			this.rank = data.rank;
			this.x = projection.x;
			this.y = projection.y;
			this.width = width;
			this.height = height;
			this.expanded = true;
			this.angle = Particles.Angles.DEFAULT;
			this.bounds = this.getBounds(1);
			this.particle = {
				center: { x: projection.x, y: projection.y },
				width: this.getParticleWidth(1),
				height: this.getParticleHeight(1),
				index: Particles.Angles.DEGREES.indexOf(Particles.Angles.DEFAULT)
			};
			this.neighbours = new Array<Node>();
		}

		private getBounds(scale: number): Bounds {
			let { offsetX, offsetY } = getRectangleOffsets(this.width, this.height, this.angle);
			let left = -offsetX;
			let right = this.width - left;
			let top = -offsetY;
			let bottom = this.height - top;

			return {
				x: this.x,
				y: this.y,
				left: left / scale,
				right: right / scale,
				top: top / scale,
				bottom: bottom / scale
			};
		}

		private getParticleWidth(scale: number): number {
			return this.width / 2 / scale;
		}

		private getParticleHeight(scale: number): number {
			return this.height / 2 / scale;
		}

		public updateBounds(scale: number) {
			this.bounds = this.getBounds(scale);
		}

		public updateParticle(scale: number) {
			this.particle.width = this.getParticleWidth(scale);
			this.particle.height = this.getParticleHeight(scale);
		}
	}

	export type NodeNeighbourDeltas = Array<Array<Array<Node>>>;

	export function createNodes(data: Array<Popup.Data>): Array<Node> {
		let nodes = new Array<Node>(data.length);

		// Create marker nodes
		for (let i = 0; i < data.length; i++) {
			const popup = data[i];
			nodes[i] = new Node(popup, i);
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

			bounds[i] = {
				x: node.x,
				y: node.y,
				left: node.width,
				right: node.width,
				top: node.height,
				bottom: node.height
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
				if (zoom < Zoom.MIN) continue;

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

	export function updateMarkers(nodes: Array<Node>, markers: Map<string, Marker>, zoom: number) {
		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i];
			if (node.expanded == false) continue;

			const marker = markers.get(node.id);
			if (!marker) throw new Error('Marker not found');

			// Update marker zoom when expanded
			marker.zoomAfterExpanded = zoom;

			// Update marker angles
			// If the last angle value is different from the new angle value, add the new angle
			// (ang[0] = threshold, ang[1] = value)
			if (marker.zoomAfterAngles.length == 0) {
				marker.zoomAfterAngles.push([zoom, node.angle]);
			} else {
				if (marker.zoomAfterAngles[0][1] != node.angle) {
					marker.zoomAfterAngles.unshift([zoom, node.angle]);
				} else {
					marker.zoomAfterAngles[0][0] = zoom;
				}
			}
		}
	}

	export namespace Bounds {
		function updateArray(nodes: Array<Node>, newNode: Node) {
			if (nodes.indexOf(newNode) == -1) {
				nodes.push(newNode);
				return true;
			} else {
				return false;
			}
		}

		export function updateBounds(nodes: Array<Node>, scale: number) {
			for (let i = 0; i < nodes.length; i++) {
				nodes[i].updateBounds(scale);
			}
		}

		export function updateOverlapingNodes(overlapingNodes: Array<Node>, nodes: Array<Node>) {
			// Update the set of overlaping nodes with one new node
			// with the lowest number of neighbours

			for (let i = 0; i < nodes.length; i++) {
				const node1 = nodes[i];
				const bounds1 = node1.bounds;
				const neighbours1 = nodes[i].neighbours;

				for (let j = 0; j < neighbours1.length; j++) {
					const node2 = neighbours1[j];
					const bounds2 = node2.bounds;

					if (areBoundsOverlaping(bounds2, bounds1)) {
						if (node1.rank < node2.rank) {
							if (updateArray(overlapingNodes, node1)) return true;
							if (updateArray(overlapingNodes, node2)) return true;
						} else {
							if (updateArray(overlapingNodes, node2)) return true;
							if (updateArray(overlapingNodes, node1)) return true;
						}
					}
				}
			}

			return false;
		}

		export function getAreOverlaping(nodes: Array<Node>): boolean {
			for (let i = 0; i < nodes.length; i++) {
				const node1 = nodes[i];
				const bounds1 = node1.bounds;
				const neighbours1 = nodes[i].neighbours;

				for (let j = 0; j < neighbours1.length; j++) {
					const node2 = nodes[j];
					const bounds2 = node2.bounds;

					if (areBoundsOverlaping(bounds2, bounds1)) {
						return true;
					}
				}
			}

			return false;
		}

		export function getOverlapingIndex(nodes: Array<Node>): number {
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
						score += 1 + (node2.rank - node1.rank);
					}
				}

				score = score * neighbours1.length;

				if (score > worstScore) {
					worstScore = score;
					worstNodeIndex = i;
				}
			}

			return worstNodeIndex;
		}
	}

	export namespace Simulation {
		export function getRadius(node: Node, scale: number): number {
			const proprtion = 2;
			const radius = Math.min(node.width, node.height) / proprtion / scale;
			return radius;
		}

		export function updateParticles(nodes: Array<Node>, scale: number) {
			for (let i = 0; i < nodes.length; i++) {
				const node = nodes[i];
				node.updateParticle(scale);
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

		export function initializeAngles(nodes: Array<Node>) {
			const particles = nodes.map((n) => n.particle);
			Particles.initializePointIndexes(particles.map((n) => [n, particles]));

			for (let i = 0; i < nodes.length; i++) {
				const node = nodes[i];
				node.angle = Particles.Angles.DEGREES[node.particle.index];
			}
		}
	}

	export namespace Zoom {
		export const MIN = MAP_MIN_ZOOM;
		export const MAX = MAP_MAX_ZOOM;

		export const SCALE = MAP_ZOOM_SCALE;
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

function getStates(data: Array<Popup.Data>): Popup.State[] {
	if (data.length == 0) return [];
	if (data.length == 1) return [[MAP_MIN_ZOOM, [[MAP_MIN_ZOOM, MARKER_DEFAULT_ANGLE]]]];

	// Initialize markers
	const markers = new Map<string, Nodes.Marker>(data.map((p) => [p.id, new Nodes.Marker()]));

	// Initialze nodes
	const nodes = Nodes.createNodes(data);
	const nodeNeighbourDeltas = Nodes.createNeighbourDeltas(nodes);

	// Initialize zoom
	const zoomMin = Nodes.Zoom.MIN;
	const zoomMax = Nodes.Zoom.getZoomMax(nodeNeighbourDeltas);

	// Initialize angles
	Nodes.Simulation.initializeAngles(nodes);
	// Initially add the last threshold event
	Nodes.updateMarkers(nodes, markers, Nodes.Zoom.addSteps(Nodes.Zoom.MAX, 1));

	// Go from last to first zoom
	for (let zoom = zoomMax; zoom >= zoomMin; zoom = Nodes.Zoom.addSteps(zoom, -1)) {
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
			// Update the simulation for a given zoom level
			Nodes.Simulation.updateParticles(graph, zoomScale);

			// Remove some overlaping nodes from the array
			// until there is no overlaping nodes
			loop: while (true) {
				// If there are no overlaping nodes in graph break the loop
				const overlaps = new Array<Nodes.Node>();
				const overlapsChanged = Nodes.Bounds.updateOverlapingNodes(overlaps, graph);
				if (overlapsChanged == false) break;

				// Run the simulation loop
				// to update the angles of the nodes
				while (true) {
					// Update node angles in the simulation
					const simStable = Nodes.Simulation.updateAngles(overlaps);
					// Update node bounds after angle update
					Nodes.Bounds.updateBounds(overlaps, zoomScale);

					// If there are no overlaping nodes after angle update
					// break to outer loop
					const simOverlaping = Nodes.Bounds.getAreOverlaping(overlaps);
					if (simOverlaping == false) break loop;

					// If there are overlaping nodes
					// but the simulation is not stable, continue simulation loop
					if (simStable == false) continue;

					// If there are still overlaping nodes and the simulation is stable
					// check if there are new overlaping nodes
					const simChanged = Nodes.Bounds.updateOverlapingNodes(overlaps, graph);
					// If there are no new overlaping nodes, break the loop
					if (simChanged == false) break;
				}

				// Get the index of the worst overlaping node
				// If there is an no overlaping node break
				const collapsedIndex = Nodes.Bounds.getOverlapingIndex(graph);
				if (collapsedIndex == -1) break;

				// Else, collapse it
				Nodes.updateCollapsed(graph[collapsedIndex]);

				// And remove it from the array
				// and try again if there is more than one node
				graph.splice(collapsedIndex, 1);
				if (graph.length == 1) break;
			}
		}

		// Update markers
		Nodes.updateMarkers(nodes, markers, Number(zoom.toFixed(1)));
	}

	return Array.from(markers.values()).map((s) => [s.zoomAfterExpanded, s.zoomAfterAngles]);
}

export { getStates };
