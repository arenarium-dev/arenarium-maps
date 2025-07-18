import { Particles } from '$lib/map/manager/compute/particles.js';
import { Bounds } from '$lib/map/manager/compute/bounds.js';

import { Rectangle } from '$lib/map/rectangle.js';
import { Mercator } from '$lib/map/mercator.js';

import { Angles } from '$lib/map/constants.js';
import type { MapProviderParameters, MapTooltipState, MapTooltipStateInput } from '$lib/map/schemas.js';

namespace Nodes {
	export class Tooltip {
		zoomAfterExpanded: number;
		zoomAfterAngleIndexes: [number, number][];

		constructor() {
			this.zoomAfterExpanded = NaN;
			this.zoomAfterAngleIndexes = [];
		}
	}

	export class Node implements Particles.ParticleSimulationItem {
		// PROPERTIES
		/** The index of the node in the nodes array. */
		index: number;
		/** The id of the tooltip that this node represents. */
		id: string;
		/** The rank of the tooltip node. */
		rank: number;
		/** The x coordinate of the tooltip node. */
		x: number;
		/** The y coordinate of the tooltip node. */
		y: number;
		/** The width of the tooltip node. */
		width: number;
		/** The height of the tooltip node. */
		height: number;

		// STATE
		/** State of the tooltip expanded or not. */
		expanded: boolean;
		/** The angle of the tooltip node. */
		angle: number;
		/** The bounds of the tooltip node. */
		bounds: Bounds;
		/** The neighbours of the tooltip node. */
		neighbours: Array<Node>;

		// SIMULATION
		/** A node has a particle whose position is used to calculate the angle */
		particle: Particles.Particle;
		/** The particles that influence the node particle. */
		influences: Particles.Particle[];

		constructor(parameters: MapProviderParameters, input: MapTooltipStateInput, index: number) {
			const projection = Mercator.project(input.lat, input.lng, parameters.mapSize);
			const width = input.width + 2 * input.margin;
			const height = input.height + 2 * input.margin;

			this.index = index;
			this.id = input.id;
			this.rank = input.rank;
			this.x = projection.x;
			this.y = projection.y;
			this.width = width;
			this.height = height;

			this.expanded = true;
			this.angle = Angles.DEFAULT;
			this.bounds = this.getBounds(1);
			this.neighbours = new Array<Node>();

			this.particle = new Particles.Particle(
				{ x: projection.x, y: projection.y },
				this.getParticleWidth(1),
				this.getParticleHeight(1),
				Angles.DEGREES.indexOf(Angles.DEFAULT)
			);
			this.influences = [];
		}

		private getBounds(scale: number): Bounds {
			let { offsetX, offsetY } = Rectangle.getOffsets(this.width, this.height, this.angle);
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

	export class Zoom {
		public min: number;
		public max: number;
		public scale: number;
		public step: number;

		constructor(parameters: MapProviderParameters) {
			this.min = parameters.zoomMin;
			this.max = parameters.zoomMax;
			this.scale = parameters.zoomScale;
			this.step = 1 / this.scale;
		}

		public addSteps(zoom: number, count: number) {
			return Math.round((zoom + count * this.step) * this.scale) / this.scale;
		}

		public getIndex(zwt: number) {
			if (zwt < this.min) return;
			return Math.min(Math.ceil(zwt * this.scale), this.max * this.scale);
		}

		public getMax(nodesNeighbourDeltas: Nodes.NodeNeighbourDeltas): number {
			let zoom = this.min;

			for (let i = 0; i < nodesNeighbourDeltas.length; i++) {
				const nodeNeighbourDeltas = nodesNeighbourDeltas[i];
				const nodeNeighbourDeltasZoomKeys = nodeNeighbourDeltas.keys();

				for (const zoomKey of nodeNeighbourDeltasZoomKeys) {
					const zoomValue = Number(zoomKey) / this.scale;
					if (zoomValue > zoom) zoom = zoomValue;
				}
			}

			return zoom;
		}
	}

	export function createNodes(parameters: MapProviderParameters, input: Array<MapTooltipStateInput>): Array<Node> {
		let nodes = new Array<Node>(input.length);

		// Create tooltip nodes
		for (let i = 0; i < input.length; i++) {
			nodes[i] = new Node(parameters, input[i], i);
		}

		return nodes;
	}

	export function createNeighbourDeltas(zoom: Zoom, nodes: Array<Node>): NodeNeighbourDeltas {
		// Create array of neighbours deltas for each node
		// at each zoom level
		const nodesNeighbourDeltas: NodeNeighbourDeltas = new Array<Array<Array<Node>>>();

		for (let i = 0; i < nodes.length; i++) {
			nodesNeighbourDeltas[i] = new Array<Array<Node>>();
		}

		// Create tooltip connection bounds of influence,
		// bounds are the maximum rectangle where the tooltip can be positioned
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

		// Calculate tooltip connections zoom when touching,
		// the zoom when touching is the maximum zoom level at
		// which the tooltips influencing each others position (angle, expanded, etc.)
		for (let i1 = 0; i1 < nodes.length; i1++) {
			const node1 = nodes[i1];
			const bounds1 = bounds[i1];
			const neighboursDeltas1 = nodesNeighbourDeltas[i1];

			for (let i2 = i1 + 1; i2 < nodes.length; i2++) {
				const node2 = nodes[i2];
				const bounds2 = bounds[i2];
				const neighboursDeltas2 = nodesNeighbourDeltas[i2];

				const zwt = Bounds.getZoomWhenTouching(bounds1, bounds2);
				const zoomIndex = zoom.getIndex(zwt);
				if (zoomIndex == undefined) continue;

				const zoomNeighbourDelta1 = neighboursDeltas1[zoomIndex];
				const zoomNeighbourDelta2 = neighboursDeltas2[zoomIndex];

				if (zoomNeighbourDelta1) zoomNeighbourDelta1.push(node2);
				else neighboursDeltas1[zoomIndex] = [node2];

				if (zoomNeighbourDelta2) zoomNeighbourDelta2.push(node1);
				else neighboursDeltas2[zoomIndex] = [node1];
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
				node.influences.length = 0;
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
				node.influences.push(neighbour.particle);
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

	export function updateTooltips(nodes: Array<Node>, tooltips: Map<string, Tooltip>, zoom: number) {
		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i];
			if (node.expanded == false) continue;

			const tooltip = tooltips.get(node.id);
			if (!tooltip) throw new Error('Tooltip not found');

			// Update tooltip zoom when expanded
			tooltip.zoomAfterExpanded = zoom;

			// Update tooltip angles
			// If the last angle value is different from the new angle value, add the new angle
			// (ang[0] = threshold, ang[1] = angle index)
			const angleIndex = Angles.DEGREES.indexOf(node.angle);

			if (tooltip.zoomAfterAngleIndexes.length == 0) {
				tooltip.zoomAfterAngleIndexes.push([zoom, angleIndex]);
			} else {
				if (tooltip.zoomAfterAngleIndexes[0][1] != angleIndex) {
					tooltip.zoomAfterAngleIndexes.unshift([zoom, angleIndex]);
				} else {
					tooltip.zoomAfterAngleIndexes[0][0] = zoom;
				}
			}
		}
	}

	export function updateBounds(nodes: Array<Node>, scale: number) {
		for (let i = 0; i < nodes.length; i++) {
			nodes[i].updateBounds(scale);
		}
	}

	export function getOverlaps(nodes: Array<Node>): Set<Node> {
		const overlaps = new Set<Node>();

		for (let i = 0; i < nodes.length; i++) {
			const node1 = nodes[i];
			const bounds1 = node1.bounds;
			const neighbours1 = nodes[i].neighbours;

			for (let j = 0; j < neighbours1.length; j++) {
				const node2 = neighbours1[j];
				const bounds2 = node2.bounds;

				if (Bounds.areOverlaping(bounds2, bounds1)) {
					overlaps.add(node1);
					overlaps.add(node2);
				}
			}
		}

		return overlaps;
	}

	export function updateOverlaps(overlaps: Set<Node>, nodes: Array<Node>) {
		let updated = false;

		for (let i = 0; i < nodes.length; i++) {
			const node1 = nodes[i];
			const bounds1 = node1.bounds;
			const neighbours1 = nodes[i].neighbours;

			for (let j = 0; j < neighbours1.length; j++) {
				const node2 = neighbours1[j];
				const bounds2 = node2.bounds;

				if (Bounds.areOverlaping(bounds2, bounds1)) {
					if (!overlaps.has(node1)) {
						overlaps.add(node1);
						updated = true;
					}
					if (!overlaps.has(node2)) {
						overlaps.add(node2);
						updated = true;
					}
				}
			}
		}

		return updated;
	}

	export function getOverlapsWorstNode(nodes: Array<Node>): Node | undefined {
		let worstNode: Node | undefined = undefined;
		let worstScore = 0;

		for (let i = 0; i < nodes.length; i++) {
			const node1 = nodes[i];
			const bounds1 = node1.bounds;
			const neighbours1 = nodes[i].neighbours;

			let score = 0;

			for (let j = 0; j < neighbours1.length; j++) {
				const node2 = neighbours1[j];
				const bounds2 = node2.bounds;

				if (Bounds.areOverlaping(bounds2, bounds1)) {
					score += 1 + (node2.rank - node1.rank);
				}
			}

			score = score * neighbours1.length;

			if (score > worstScore) {
				worstScore = score;
				worstNode = node1;
			}
		}

		return worstNode;
	}

	export function areOverlaping(nodes: Array<Node>): boolean {
		for (let i = 0; i < nodes.length; i++) {
			const node1 = nodes[i];
			const bounds1 = node1.bounds;

			for (let j = i + 1; j < nodes.length; j++) {
				const node2 = nodes[j];
				const bounds2 = node2.bounds;

				if (Bounds.areOverlaping(bounds2, bounds1)) {
					return true;
				}
			}
		}

		return false;
	}

	export namespace Simulation {
		export function initializeAngles(nodes: Array<Node>) {
			const particles = nodes.map((n) => n.particle);
			Particles.initializePointIndexes(particles.map((n) => ({ particle: n, influences: particles })));

			for (let i = 0; i < nodes.length; i++) {
				const node = nodes[i];
				node.angle = Angles.DEGREES[node.particle.index];
			}
		}

		export function updateAngles(nodes: Array<Node>) {
			const stable = Particles.updatePointIndexes(nodes);

			for (let i = 0; i < nodes.length; i++) {
				const node = nodes[i];
				node.angle = Angles.DEGREES[node.particle.index];
			}

			return stable;
		}

		export function updateParticles(nodes: Array<Node>, scale: number) {
			for (let i = 0; i < nodes.length; i++) {
				const node = nodes[i];
				node.updateParticle(scale);
			}
		}
	}
}

function getStates(parameters: MapProviderParameters, data: Array<MapTooltipStateInput>): MapTooltipState[] {
	const nodesZoom = new Nodes.Zoom(parameters);

	if (data.length == 0) return [];
	if (data.length == 1) return [[nodesZoom.min, [[nodesZoom.min, Angles.DEGREES.indexOf(Angles.DEFAULT)]]]];

	// Initialize tooltips
	const tooltips = new Map<string, Nodes.Tooltip>(data.map((p) => [p.id, new Nodes.Tooltip()]));

	// Initialze nodes
	const nodes = Nodes.createNodes(parameters, data);
	const nodeNeighbourDeltas = Nodes.createNeighbourDeltas(nodesZoom, nodes);

	// Initialize zoom
	const zoomMin = nodesZoom.min;
	const zoomMax = nodesZoom.getMax(nodeNeighbourDeltas);

	// Initialize angles
	Nodes.Simulation.initializeAngles(nodes);
	// Initially add the last threshold event
	Nodes.updateTooltips(nodes, tooltips, nodesZoom.addSteps(nodesZoom.max, 1));

	// Go from last to first zoom
	for (let zoom = zoomMax; zoom >= zoomMin; zoom = nodesZoom.addSteps(zoom, -1)) {
		// Calculate scale
		const zoomScale = Math.pow(2, zoom);
		const zoomIndex = Math.round(zoom * nodesZoom.scale);

		// Update expanded nodes neighbours
		Nodes.updateNeighbours(nodes, nodeNeighbourDeltas, zoomIndex);
		// Get expanded node graphs
		const graphs = Nodes.getNeighbourGraphs(nodes);

		for (const graph of graphs) {
			// Update node bounds
			Nodes.updateBounds(graph, zoomScale);
			// Update the simulation for a given zoom level
			Nodes.Simulation.updateParticles(graph, zoomScale);

			// Get graph overlaps with neighbours
			const overlaps = Nodes.getOverlaps(graph);

			// Remove overlaping nodes from the set
			// until there is no overlaping nodes
			while (overlaps.size > 1) {
				// Run the simulation loop
				// to update the angles of the nodes
				const overlapsArray = Array.from(overlaps);

				while (true) {
					// Update node angles in the simulation
					const simStable = Nodes.Simulation.updateAngles(overlapsArray);
					// Update node bounds after angle update
					Nodes.updateBounds(overlapsArray, zoomScale);

					// If the simulation is stable break
					if (simStable == true) break;
					// If there are no overlaping nodes after simulation break
					if (Nodes.areOverlaping(overlapsArray) == false) break;
				}

				// Update overlaps with neighbours set after angle update
				// to check for new overlaps
				const overlapsChanged = Nodes.updateOverlaps(overlaps, overlapsArray);
				if (overlapsChanged) continue;

				// Get the index of the worst overlaping node
				// If there is an no overlaping node break
				const overlapsWorstNode = Nodes.getOverlapsWorstNode(overlapsArray);
				if (overlapsWorstNode == undefined) break;

				// Collapse it
				Nodes.updateCollapsed(overlapsWorstNode);
				// And remove it from the set
				overlaps.delete(overlapsWorstNode);
			}
		}

		// Update tooltips
		Nodes.updateTooltips(nodes, tooltips, Number(zoom.toFixed(1)));
	}

	return Array.from(tooltips.values()).map((s) => [s.zoomAfterExpanded, s.zoomAfterAngleIndexes]);
}

export { getStates };
