import { Bounds } from '$lib/map/manager/compute/bounds.js';

import { Mercator } from '$lib/map/mercator.js';
import { Rectangle } from '$lib/map/rectangle.js';
import { Angles } from '$lib/map/constants.js';
import type { MapProviderParameters, MapTooltipState, MapTooltipStateInput } from '$lib/map/schemas.js';

class Tooltip {
	x: number;
	y: number;
	width: number;
	height: number;
	zoom: number;
	angles: [number, number][];

	expanded: boolean;
	angle: number;
	bounds: Bounds.Overlappable | undefined;

	constructor(parameters: MapProviderParameters, input: MapTooltipStateInput, state: MapTooltipState) {
		const point = Mercator.project(input.lat, input.lng, parameters.mapSize);
		this.x = point.x;
		this.y = point.y;
		this.width = input.width + 2 * input.margin;
		this.height = input.height + 2 * input.margin;
		this.zoom = state[0];
		this.angles = state[1].map((s) => [s[0], Angles.DEGREES[s[1]]]);

		this.expanded = false;
		this.angle = 0;
		this.bounds = undefined;
	}

	getBounds(scale: number, angle: number): Bounds.Overlappable {
		let offsets = Rectangle.getOffsets(this.width, this.height, angle);
		let left = -offsets.x;
		let right = this.width - left;
		let top = -offsets.y;
		let bottom = this.height - top;

		return {
			x: this.x,
			y: this.y,
			distances: {
				left: left / scale,
				right: right / scale,
				top: top / scale,
				bottom: bottom / scale
			}
		};
	}
}

export function testStates(parameters: MapProviderParameters, inputs: MapTooltipStateInput[], states: MapTooltipState[]) {
	if (inputs.length != states.length) throw new Error('Data and states length must be the same');

	const tooltips = new Array<Tooltip>(inputs.length);
	for (let i = 0; i < inputs.length; i++) {
		const state = states[i];
		if (isNaN(state[0])) throw new Error('State zoom is not a number');
		if (state[1] == undefined || state[1].length == 0) throw new Error('State angles is empty');
		if (state[0] != state[1][0][0]) throw new Error('State expand zoom and start angles zoom are not the same');

		const tooltip = new Tooltip(parameters, inputs[i], states[i]);
		tooltips[i] = tooltip;
	}

	const zoomStart = parameters.zoomMin;
	const zoomEnd = parameters.zoomMax;
	const zoomStep = 1 / parameters.zoomScale;

	for (let zoom = zoomStart; zoom <= zoomEnd; zoom += zoomStep) {
		const scale = Math.pow(2, zoom);

		for (let i = 0; i < tooltips.length; i++) {
			const tooltip = tooltips[i];
			tooltip.expanded = tooltip.zoom < zoom;
			if (tooltip.expanded == false) continue;

			const angle = tooltip.angles.findLast((a) => a[0] < zoom)?.[1];
			if (angle == undefined) throw new Error('Angle not found');

			tooltip.angle = angle;
			tooltip.bounds = tooltip.getBounds(scale, angle);
		}

		for (let i = 0; i < tooltips.length; i++) {
			const tooltip1 = tooltips[i];
			if (tooltip1.bounds == undefined) continue;

			for (let j = i + 1; j < tooltips.length; j++) {
				const tooltip2 = tooltips[j];
				if (tooltip2.bounds == undefined) continue;

				if (Bounds.areOverlaping(tooltip1.bounds, tooltip2.bounds)) {
					console.log('OVERLAP', zoom, tooltip1, inputs[i], tooltip2, inputs[j]);

					const x11 = tooltip1.bounds.x - tooltip1.bounds.distances.left;
					const x12 = tooltip1.bounds.x + tooltip1.bounds.distances.right;
					const y11 = tooltip1.bounds.y - tooltip1.bounds.distances.top;
					const y12 = tooltip1.bounds.y + tooltip1.bounds.distances.bottom;
					console.log(
						`B1: (${x11}, ${y11}), (${x11}, ${y12}), (${x12}, ${y11}), (${x12}, ${y12}), (${tooltip1.bounds.x}, ${tooltip1.bounds.y})`,
						tooltip1.angle
					);

					const x21 = tooltip2.bounds.x - tooltip2.bounds.distances.left;
					const x22 = tooltip2.bounds.x + tooltip2.bounds.distances.right;
					const y21 = tooltip2.bounds.y - tooltip2.bounds.distances.top;
					const y22 = tooltip2.bounds.y + tooltip2.bounds.distances.bottom;
					console.log(
						`B2: (${x21}, ${y21}), (${x21}, ${y22}), (${x22}, ${y21}), (${x22}, ${y22}), (${tooltip2.bounds.x}, ${tooltip2.bounds.y})`,
						tooltip2.angle
					);

					throw new Error('Bounds overlaping');
				}
			}
		}
	}
}
