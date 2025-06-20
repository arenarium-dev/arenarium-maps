import { Bounds } from './bounds.js';

import { Mercator } from '../mercator.js';
import { Rectangle } from '../rectangle.js';

import { Angles } from '../../constants.js';
import { type Tooltip } from '../../types.js';

class Tooltip {
	x: number;
	y: number;
	width: number;
	height: number;
	zoom: number;
	angles: [number, number][];

	expanded: boolean;
	angle: number;
	bounds: Bounds | undefined;

	constructor(parameters: Tooltip.Parameters, data: Tooltip.StateInput, state: Tooltip.State) {
		const point = Mercator.project(data.lat, data.lng, parameters.mapSize);
		this.x = point.x;
		this.y = point.y;
		this.width = data.width + 2 * data.margin;
		this.height = data.height + 2 * data.margin;
		this.zoom = state[0];
		this.angles = state[1].map((s) => [s[0], Angles.DEGREES[s[1]]]);

		this.expanded = false;
		this.angle = 0;
		this.bounds = undefined;
	}

	getBounds(scale: number, angle: number): Bounds {
		let { offsetX, offsetY } = Rectangle.getOffsets(this.width, this.height, angle);
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
}

export function testStates(parameters: Tooltip.Parameters, data: Tooltip.StateInput[], states: Tooltip.State[]) {
	if (data.length != states.length) throw new Error('Data and states length must be the same');

	const tooltips = new Array<Tooltip>(data.length);
	for (let i = 0; i < data.length; i++) {
		const state = states[i];
		if (isNaN(state[0])) throw new Error('State zoom is not a number');
		if (state[1] == undefined || state[1].length == 0) throw new Error('State angles is empty');
		if (state[0] != state[1][0][0]) throw new Error('State expand zoom and start angles zoom are not the same');

		const tooltip = new Tooltip(parameters, data[i], states[i]);
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
					console.log('OVERLAP', zoom, data[i], data[j], tooltip1.angle, tooltip2.angle);

					const x11 = tooltip1.bounds.x - tooltip1.bounds.left;
					const y11 = tooltip1.bounds.y - tooltip1.bounds.top;
					const x12 = tooltip1.bounds.x + tooltip1.bounds.right;
					const y12 = tooltip1.bounds.y + tooltip1.bounds.bottom;
					console.log(`B1: (${x11}, ${y11}), (${x11}, ${y12}), (${x12}, ${y11}), (${x12}, ${y12})`);

					const x21 = tooltip2.bounds.x - tooltip2.bounds.left;
					const y21 = tooltip2.bounds.y - tooltip2.bounds.top;
					const x22 = tooltip2.bounds.x + tooltip2.bounds.right;
					const y22 = tooltip2.bounds.y + tooltip2.bounds.bottom;
					console.log(`B2: (${x21}, ${y21}), (${x21}, ${y22}), (${x22}, ${y21}), (${x22}, ${y22})`);

					throw new Error('Bounds overlaping');
				}
			}
		}
	}
}
