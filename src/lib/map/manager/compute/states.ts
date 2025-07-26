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

	export class Tooltip implements Bounds.Overlappable, Simulation.Runnable {
		// PROPERTIES
		/** The id of the tooltip that this tooltip represents. */
		id: string = '';
		/** The index of the tooltip in the tooltips array. */
		index: number = NaN;
		/** The rank of the tooltip tooltip. */
		rank: number = NaN;
		/** The x coordinate of the tooltip anchor. */
		x: number = NaN;
		/** The y coordinate of the tooltip anchor. */
		y: number = NaN;
		/** The base width of the tooltip tooltip. */
		width: number = NaN;
		/** The base height of the tooltip tooltip. */
		height: number = NaN;

		// STATE
		/** State of the tooltip expanded or not.  */
		expanded: boolean = true;
		/** The scale of the tooltip. */
		scale: number = 1;
		/** The angle of the tooltip. */
		angle: number = Angles.DEGREES_DEFAULT;
		/** The neighbours of the tooltip. */
		neighbours: Array<Tooltip> = new Array<Tooltip>();

		// BOUNDS
		//* Scaled distances to edges of the tooltip bounds */
		distances: Bounds.Distances = { left: NaN, right: NaN, top: NaN, bottom: NaN };

		// SIMULATION
		/** A tooltip has a particle whose position is used to calculate the angle */
		particle: Simulation.Particle = { index: Angles.DEGREES.indexOf(Angles.DEGREES_DEFAULT), distX: NaN, distY: NaN };

		constructor(parameters: MapProviderParameters, input: MapTooltipStateInput, index: number) {
			const projection = Mercator.project(input.lat, input.lng, parameters.mapSize);

			this.index = index;
			this.id = input.id;
			this.rank = input.rank;
			this.x = projection.x;
			this.y = projection.y;
			this.width = input.width + 2 * input.margin;
			this.height = input.height + 2 * input.margin;
		}

		public updateScale(scale: number) {
			if (scale == this.scale) return;
			this.scale = scale;

			this.updateBounds(scale, this.angle);
			this.updateParticle(scale);
		}

		public updateAngle(angle: number) {
			if (angle == this.angle) return;
			this.angle = angle;

			this.updateBounds(this.scale, angle);
		}

		private updateBounds(scale: number, angle: number) {
			const offsets = Rectangle.getOffsets(this.width, this.height, angle);

			const baseLeft = -offsets.x;
			const baseRight = this.width - baseLeft;
			const baseTop = -offsets.y;
			const baseBottom = this.height - baseTop;

			const distances = this.distances;
			distances.left = baseLeft / scale;
			distances.right = baseRight / scale;
			distances.top = baseTop / scale;
			distances.bottom = baseBottom / scale;
		}

		public updateParticle(scale: number) {
			this.particle.distX = this.width / 2 / scale;
			this.particle.distY = this.height / 2 / scale;
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

	export function createTooltipsNeighbours(tooltips: Array<Tooltip>, zoom: Zoom): TooltipNeighbours {
		// Create array of neighbours deltas for each tooltip
		// at each zoom level
		let tooltipsNeighbourDeltas: TooltipNeighbourDeltas = new Array<Array<Array<Tooltip>>>();
		let tooltipsNeighbourMaxZwt = 0;

		for (let i = 0; i < tooltips.length; i++) {
			tooltipsNeighbourDeltas[i] = new Array<Array<Tooltip>>();
		}

		// Create tooltip connection bounds of influence,
		// bounds are the maximum rectangle where the tooltip can be positioned
		const bounds = new Array<Bounds.Overlappable>(tooltips.length);

		for (let i = 0; i < tooltips.length; i++) {
			const tooltip = tooltips[i];

			bounds[i] = {
				x: tooltip.x,
				y: tooltip.y,
				distances: {
					left: tooltip.width,
					right: tooltip.width,
					top: tooltip.height,
					bottom: tooltip.height
				}
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
		}
	}

	export function updateStates(states: Map<string, State>, tooltips: Array<Tooltip>, zoom: number) {
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

	export function updateScale(tooltips: Array<Tooltip>, scale: number) {
		for (let i = 0; i < tooltips.length; i++) {
			tooltips[i].updateScale(scale);
		}
	}

	export function getOverlaps(tooltips: Array<Tooltip>): Set<Tooltip> {
		const overlaps = new Set<Tooltip>();

		for (let i = 0; i < tooltips.length; i++) {
			const tooltip1 = tooltips[i];
			const neighbours1 = tooltips[i].neighbours;

			for (let j = 0; j < neighbours1.length; j++) {
				const tooltip2 = neighbours1[j];

				if (Bounds.areOverlaping(tooltip1, tooltip2)) {
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
			const neighbours1 = tooltips[i].neighbours;

			for (let j = 0; j < neighbours1.length; j++) {
				const tooltip2 = neighbours1[j];

				if (Bounds.areOverlaping(tooltip1, tooltip2)) {
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
			const neighbours1 = tooltips[i].neighbours;

			let score = 0;

			for (let j = 0; j < neighbours1.length; j++) {
				const tooltip2 = neighbours1[j];

				if (Bounds.areOverlaping(tooltip1, tooltip2)) {
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

			for (let j = i + 1; j < tooltips.length; j++) {
				const tooltip2 = tooltips[j];

				if (Bounds.areOverlaping(tooltip1, tooltip2)) {
					return true;
				}
			}
		}

		return false;
	}

	export namespace Particles {
		export function initializeAngles(tooltips: Array<Tooltip>) {
			Simulation.initializeAngleIndexes(tooltips);
			updateTooltips(tooltips);
		}

		export function updateAngles(tooltips: Array<Tooltip>) {
			const stable = Simulation.updateAngleIndexes(tooltips);
			updateTooltips(tooltips);
			return stable;
		}

		export function updateTooltips(tooltips: Array<Tooltip>) {
			for (let i = 0; i < tooltips.length; i++) {
				const tooltip = tooltips[i];
				tooltip.updateAngle(Angles.DEGREES[tooltip.particle.index]);
			}
		}
	}
}

function getStates(parameters: MapProviderParameters, data: Array<MapTooltipStateInput>): MapTooltipState[] {
	const tooltipsZoom = new Tooltips.Zoom(parameters);

	if (data.length == 0) return [];
	if (data.length == 1) return [[tooltipsZoom.min, [[tooltipsZoom.min, Angles.DEGREES.indexOf(Angles.DEGREES_DEFAULT)]]]];

	// Initialize tooltips
	const tooltipStates = new Map<string, Tooltips.State>(data.map((p) => [p.id, new Tooltips.State()]));

	// Initialze tooltips
	const tooltips = Tooltips.createTooltips(parameters, data);
	const tooltipsNeighbours = Tooltips.createTooltipsNeighbours(tooltips, tooltipsZoom);

	// Initialize angles
	Tooltips.Particles.initializeAngles(tooltips);
	// Initially add the last threshold event
	Tooltips.updateStates(tooltipStates, tooltips, tooltipsZoom.addSteps(tooltipsZoom.max, 1));

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
			Tooltips.updateScale(graph, zoomScale);

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
		Tooltips.updateStates(tooltipStates, tooltips, Number(zoom.toFixed(1)));
	}

	return Array.from(tooltipStates.values()).map((s) => [s.zoomAfterExpanded, s.zoomAfterAngleIndexes]);
}

export { getStates };
