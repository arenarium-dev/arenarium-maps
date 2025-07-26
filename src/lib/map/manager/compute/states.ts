import { Simulation } from '$lib/map/manager/compute/simulation.js';
import { Bounds } from '$lib/map/manager/compute/bounds.js';

import { Rectangle } from '$lib/map/rectangle.js';
import { Mercator } from '$lib/map/mercator.js';

import { Angles } from '$lib/map/constants.js';
import type { MapProviderParameters, MapTooltipState, MapTooltipStateInput } from '$lib/map/schemas.js';

namespace Tooltips {
	export class State {
		zoomAfterExpanded: number;
		zoomAfterAngleIndexes: [number, number][];

		constructor() {
			this.zoomAfterExpanded = NaN;
			this.zoomAfterAngleIndexes = [];
		}
	}

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
	}

	export class Tooltip implements Simulation.Item {
		// PROPERTIES
		/** The index of the tooltip in the tooltips array. */
		index: number;
		/** The id of the tooltip that this tooltip represents. */
		id: string;
		/** The rank of the tooltip tooltip. */
		rank: number;
		/** The x coordinate of the tooltip tooltip. */
		x: number;
		/** The y coordinate of the tooltip tooltip. */
		y: number;
		/** The width of the tooltip tooltip. */
		width: number;
		/** The height of the tooltip tooltip. */
		height: number;

		// STATE
		/** State of the tooltip expanded or not. */
		expanded: boolean;
		/** The angle of the tooltip. */
		angle: number;
		/** The bounds of the tooltip. */
		bounds: Bounds;
		/** The neighbours of the tooltip. */
		neighbours: Array<Tooltip>;

		// SIMULATION
		/** A tooltip has a particle whose position is used to calculate the angle */
		particle: Simulation.Particle;
		/** The particles that influence the tooltip particle. */
		influences: Simulation.Particle[];

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
			this.neighbours = new Array<Tooltip>();

			this.particle = new Simulation.Particle(
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

	export type TooltipNeighbourDeltas = Array<Array<Array<Tooltip>>>;

	export interface TooltipNeighbours {
		maxZwt: number;
		deltas: TooltipNeighbourDeltas;
	}

	export function createTooltips(parameters: MapProviderParameters, input: Array<MapTooltipStateInput>): Array<Tooltip> {
		let tooltips = new Array<Tooltip>(input.length);

		// Create tooltip tooltips
		for (let i = 0; i < input.length; i++) {
			tooltips[i] = new Tooltip(parameters, input[i], i);
		}

		return tooltips;
	}

	export function createTooltipsNeighbours(zoom: Zoom, tooltips: Array<Tooltip>): TooltipNeighbours {
		// Create array of neighbours deltas for each tooltip
		// at each zoom level
		let tooltipsNeighbourDeltas: TooltipNeighbourDeltas = new Array<Array<Array<Tooltip>>>();
		let tooltipsNeighbourMaxZwt = 0;

		for (let i = 0; i < tooltips.length; i++) {
			tooltipsNeighbourDeltas[i] = new Array<Array<Tooltip>>();
		}

		// Create tooltip connection bounds of influence,
		// bounds are the maximum rectangle where the tooltip can be positioned
		const bounds = new Array<Bounds>(tooltips.length);

		for (let i = 0; i < tooltips.length; i++) {
			const tooltip = tooltips[i];

			bounds[i] = {
				x: tooltip.x,
				y: tooltip.y,
				left: tooltip.width,
				right: tooltip.width,
				top: tooltip.height,
				bottom: tooltip.height
			};
		}

		// Calculate tooltip connections zoom when touching,
		// the zoom when touching is the maximum zoom level at
		// which the tooltips influencing each others position (angle, expanded, etc.)
		for (let i1 = 0; i1 < tooltips.length; i1++) {
			const tooltip1 = tooltips[i1];
			const bounds1 = bounds[i1];
			const neighboursDeltas1 = tooltipsNeighbourDeltas[i1];

			for (let i2 = i1 + 1; i2 < tooltips.length; i2++) {
				const tooltip2 = tooltips[i2];
				const bounds2 = bounds[i2];
				const neighboursDeltas2 = tooltipsNeighbourDeltas[i2];

				const zwt = Bounds.getZoomWhenTouching(bounds1, bounds2);
				if (zwt > tooltipsNeighbourMaxZwt) tooltipsNeighbourMaxZwt = zwt;

				const zoomIndex = zoom.getIndex(zwt);
				if (zoomIndex == undefined) continue;

				const zoomNeighbourDelta1 = neighboursDeltas1[zoomIndex];
				const zoomNeighbourDelta2 = neighboursDeltas2[zoomIndex];

				if (zoomNeighbourDelta1) zoomNeighbourDelta1.push(tooltip2);
				else neighboursDeltas1[zoomIndex] = [tooltip2];

				if (zoomNeighbourDelta2) zoomNeighbourDelta2.push(tooltip1);
				else neighboursDeltas2[zoomIndex] = [tooltip1];
			}
		}

		return {
			maxZwt: tooltipsNeighbourMaxZwt,
			deltas: tooltipsNeighbourDeltas
		};
	}

	export function getNeighbourGraphs(tooltips: Array<Tooltip>): Array<Array<Tooltip>> {
		const visited = new Set<Tooltip>();
		const graphs: Tooltip[][] = [];

		for (let i = 0; i < tooltips.length; i++) {
			let tooltip = tooltips[i];
			if (tooltip.expanded == false) continue;
			if (tooltip.neighbours.length == 0) continue;

			if (visited.has(tooltip)) continue;
			visited.add(tooltip);

			const graph: Tooltip[] = [];
			const stack: Tooltip[] = [tooltip];

			while (stack.length > 0) {
				const stackTooltip = stack.pop()!;
				graph.push(stackTooltip);

				for (const neighbour of stackTooltip.neighbours) {
					if (visited.has(neighbour)) continue;

					visited.add(neighbour);
					stack.push(neighbour);
				}
			}

			graphs.push(graph);
		}

		return graphs;
	}

	export function updateNeighbours(tooltips: Array<Tooltip>, tooltipsNeighbourDeltas: TooltipNeighbourDeltas, zoomIndex: number) {
		for (let i = 0; i < tooltips.length; i++) {
			let tooltip = tooltips[i];

			// If the tooltip is not expanded, clear neighbours
			if (tooltip.expanded == false) {
				tooltip.neighbours.length = 0;
				tooltip.influences.length = 0;
				continue;
			}

			// Else, add neighbours based on delta at zoom level
			const tooltipNeighbourDeltas = tooltipsNeighbourDeltas[i];
			const zoomNeighbourDelta = tooltipNeighbourDeltas[zoomIndex];
			if (zoomNeighbourDelta == undefined) continue;

			for (let j = 0; j < zoomNeighbourDelta.length; j++) {
				const neighbour = zoomNeighbourDelta[j];
				if (neighbour.expanded == false) continue;

				tooltip.neighbours.push(neighbour);
				tooltip.influences.push(neighbour.particle);
			}
		}
	}

	export function updateCollapsed(tooltip: Tooltip) {
		// Set tooltip expanded to false
		tooltip.expanded = false;

		// Remove tooltip from neighbours
		const tooltipNeighbours = tooltip.neighbours;
		for (let i = 0; i < tooltipNeighbours.length; i++) {
			const neighbour = tooltipNeighbours[i];
			const neighbourTooltipIndex = neighbour.neighbours.indexOf(tooltip);

			neighbour.neighbours.splice(neighbourTooltipIndex, 1);
			neighbour.influences.splice(neighbourTooltipIndex, 1);
		}
	}

	export function updateStates(tooltips: Array<Tooltip>, states: Map<string, State>, zoom: number) {
		for (let i = 0; i < tooltips.length; i++) {
			const tooltip = tooltips[i];
			if (tooltip.expanded == false) continue;

			const state = states.get(tooltip.id);
			if (!state) throw new Error('Tooltip not found');

			// Update tooltip zoom when expanded
			state.zoomAfterExpanded = zoom;

			// Update tooltip angles
			// If the last angle value is different from the new angle value, add the new angle
			// (ang[0] = threshold, ang[1] = angle index)
			const angleIndex = Angles.DEGREES.indexOf(tooltip.angle);

			if (state.zoomAfterAngleIndexes.length == 0) {
				state.zoomAfterAngleIndexes.push([zoom, angleIndex]);
			} else {
				if (state.zoomAfterAngleIndexes[0][1] != angleIndex) {
					state.zoomAfterAngleIndexes.unshift([zoom, angleIndex]);
				} else {
					state.zoomAfterAngleIndexes[0][0] = zoom;
				}
			}
		}
	}

	export function updateBounds(tooltips: Array<Tooltip>, scale: number) {
		for (let i = 0; i < tooltips.length; i++) {
			tooltips[i].updateBounds(scale);
		}
	}

	export function getOverlaps(tooltips: Array<Tooltip>): Set<Tooltip> {
		const overlaps = new Set<Tooltip>();

		for (let i = 0; i < tooltips.length; i++) {
			const tooltip1 = tooltips[i];
			const bounds1 = tooltip1.bounds;
			const neighbours1 = tooltips[i].neighbours;

			for (let j = 0; j < neighbours1.length; j++) {
				const tooltip2 = neighbours1[j];
				const bounds2 = tooltip2.bounds;

				if (Bounds.areOverlaping(bounds2, bounds1)) {
					overlaps.add(tooltip1);
					overlaps.add(tooltip2);
				}
			}
		}

		return overlaps;
	}

	export function updateOverlaps(overlaps: Set<Tooltip>, tooltips: Array<Tooltip>) {
		let updated = false;

		for (let i = 0; i < tooltips.length; i++) {
			const tooltip1 = tooltips[i];
			const bounds1 = tooltip1.bounds;
			const neighbours1 = tooltips[i].neighbours;

			for (let j = 0; j < neighbours1.length; j++) {
				const tooltip2 = neighbours1[j];
				const bounds2 = tooltip2.bounds;

				if (Bounds.areOverlaping(bounds2, bounds1)) {
					if (!overlaps.has(tooltip1)) {
						overlaps.add(tooltip1);
						updated = true;
					}
					if (!overlaps.has(tooltip2)) {
						overlaps.add(tooltip2);
						updated = true;
					}
				}
			}
		}

		return updated;
	}

	export function getOverlapsWorstTooltip(tooltips: Array<Tooltip>): Tooltip | undefined {
		let worstTooltip: Tooltip | undefined = undefined;
		let worstScore = 0;

		for (let i = 0; i < tooltips.length; i++) {
			const tooltip1 = tooltips[i];
			const bounds1 = tooltip1.bounds;
			const neighbours1 = tooltips[i].neighbours;

			let score = 0;

			for (let j = 0; j < neighbours1.length; j++) {
				const tooltip2 = neighbours1[j];
				const bounds2 = tooltip2.bounds;

				if (Bounds.areOverlaping(bounds2, bounds1)) {
					score += 1 + (tooltip2.rank - tooltip1.rank);
				}
			}

			score = score * neighbours1.length;

			if (score > worstScore) {
				worstScore = score;
				worstTooltip = tooltip1;
			}
		}

		return worstTooltip;
	}

	export function areOverlaping(tooltips: Array<Tooltip>): boolean {
		for (let i = 0; i < tooltips.length; i++) {
			const tooltip1 = tooltips[i];
			const bounds1 = tooltip1.bounds;

			for (let j = i + 1; j < tooltips.length; j++) {
				const tooltip2 = tooltips[j];
				const bounds2 = tooltip2.bounds;

				if (Bounds.areOverlaping(bounds2, bounds1)) {
					return true;
				}
			}
		}

		return false;
	}

	export namespace Particles {
		export function initializeAngles(tooltips: Array<Tooltip>) {
			const particles = tooltips.map((n) => n.particle);
			Simulation.initializePointIndexes(particles.map((n) => ({ particle: n, influences: particles })));

			for (let i = 0; i < tooltips.length; i++) {
				const tooltip = tooltips[i];
				tooltip.angle = Angles.DEGREES[tooltip.particle.index];
			}
		}

		export function updateAngles(tooltips: Array<Tooltip>) {
			const stable = Simulation.updatePointIndexes(tooltips);

			for (let i = 0; i < tooltips.length; i++) {
				const tooltip = tooltips[i];
				tooltip.angle = Angles.DEGREES[tooltip.particle.index];
			}

			return stable;
		}

		export function updateParticles(tooltips: Array<Tooltip>, scale: number) {
			for (let i = 0; i < tooltips.length; i++) {
				const tooltip = tooltips[i];
				tooltip.updateParticle(scale);
			}
		}
	}
}

function getStates(parameters: MapProviderParameters, data: Array<MapTooltipStateInput>): MapTooltipState[] {
	const tooltipsZoom = new Tooltips.Zoom(parameters);

	if (data.length == 0) return [];
	if (data.length == 1) return [[tooltipsZoom.min, [[tooltipsZoom.min, Angles.DEGREES.indexOf(Angles.DEFAULT)]]]];

	// Initialize tooltips
	const tooltipStates = new Map<string, Tooltips.State>(data.map((p) => [p.id, new Tooltips.State()]));

	// Initialze tooltips
	const tooltips = Tooltips.createTooltips(parameters, data);
	const tooltipsNeighbours = Tooltips.createTooltipsNeighbours(tooltipsZoom, tooltips);

	// Initialize angles
	Tooltips.Particles.initializeAngles(tooltips);
	// Initially add the last threshold event
	Tooltips.updateStates(tooltips, tooltipStates, tooltipsZoom.addSteps(tooltipsZoom.max, 1));

	// If there is no neighbours, return the default state
	const zoomMaxIndex = tooltipsZoom.getIndex(tooltipsNeighbours.maxZwt);
	if (zoomMaxIndex == undefined) return Array.from(tooltipStates.values()).map((s) => [s.zoomAfterExpanded, s.zoomAfterAngleIndexes]);

	// Initialize zoom
	const zoomMin = tooltipsZoom.min;
	const zoomMax = zoomMaxIndex / tooltipsZoom.scale;

	// Go from last to first zoom
	for (let zoom = zoomMax; zoom >= zoomMin; zoom = tooltipsZoom.addSteps(zoom, -1)) {
		// Calculate scale
		const zoomScale = Math.pow(2, zoom);
		const zoomIndex = Math.round(zoom * tooltipsZoom.scale);

		// Update expanded tooltips neighbours
		Tooltips.updateNeighbours(tooltips, tooltipsNeighbours.deltas, zoomIndex);
		// Get expanded tooltip graphs
		const graphs = Tooltips.getNeighbourGraphs(tooltips);

		for (const graph of graphs) {
			// Update tooltip bounds
			Tooltips.updateBounds(graph, zoomScale);
			// Update the simulation for a given zoom level
			Tooltips.Particles.updateParticles(graph, zoomScale);

			// Get graph overlaps with neighbours
			const overlaps = Tooltips.getOverlaps(graph);

			// Remove overlaping tooltips from the set
			// until there is no overlaping tooltips
			while (overlaps.size > 1) {
				// Run the simulation loop
				// to update the angles of the tooltips
				const overlapsArray = Array.from(overlaps);

				while (true) {
					// Update tooltip angles in the simulation
					const simStable = Tooltips.Particles.updateAngles(overlapsArray);
					// Update tooltip bounds after angle update
					Tooltips.updateBounds(overlapsArray, zoomScale);

					// If the simulation is stable break
					if (simStable == true) break;
					// If there are no overlaping tooltips after simulation break
					if (Tooltips.areOverlaping(overlapsArray) == false) break;
				}

				// Update overlaps with neighbours set after angle update
				// to check for new overlaps
				const overlapsChanged = Tooltips.updateOverlaps(overlaps, overlapsArray);
				if (overlapsChanged) continue;

				// Get the index of the worst overlaping tooltip
				// If there is an no overlaping tooltip break
				const overlapsWorstTooltip = Tooltips.getOverlapsWorstTooltip(overlapsArray);
				if (overlapsWorstTooltip == undefined) break;

				// Collapse it
				Tooltips.updateCollapsed(overlapsWorstTooltip);
				// And remove it from the set
				overlaps.delete(overlapsWorstTooltip);
			}
		}

		// Update tooltips
		Tooltips.updateStates(tooltips, tooltipStates, Number(zoom.toFixed(1)));
	}

	return Array.from(tooltipStates.values()).map((s) => [s.zoomAfterExpanded, s.zoomAfterAngleIndexes]);
}

export { getStates };
