import { areBoundsOverlaping, Bounds } from './bounds';
import { getPoint } from '../projection';
import { getRectangleOffsets } from '../rectangle';
import { Popup } from '../../types';
import { MAP_MAX_ZOOM, MAP_MIN_ZOOM, MAP_ZOOM_SCALE } from '../../constants';

class Popup {
	x: number;
	y: number;
	width: number;
	height: number;
	zoom: number;
	angles: [number, number][];

	expanded: boolean;
	angle: number;
	bounds: Bounds | undefined;

	constructor(data: Popup.Data, state: Popup.State) {
		const point = getPoint(data.lat, data.lng);
		this.x = point.x;
		this.y = point.y;
		this.width = data.width;
		this.height = data.height;
		this.zoom = state[0];
		this.angles = state[1];

		this.expanded = false;
		this.angle = 0;
		this.bounds = undefined;
	}

	getBounds(scale: number, angle: number): Bounds {
		let { offsetX, offsetY } = getRectangleOffsets(this.width, this.height, angle);
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

export function testStates(data: Popup.Data[], states: Popup.State[]) {
	if (data.length != states.length) throw new Error('Data and states length must be the same');

	const now = performance.now();

	const popups = new Array<Popup>(data.length);
	for (let i = 0; i < data.length; i++) {
		const state = states[i];
		if (isNaN(state[0])) throw new Error('State zoom is not a number');
		if (state[1] == undefined || state[1].length == 0) throw new Error('State angles is empty');
		if (state[0] != state[1][0][0]) throw new Error('State expand zoom and start angles zoom are not the same');

		const popup = new Popup(data[i], states[i]);
		popups[i] = popup;
	}

	const zoomStart = MAP_MIN_ZOOM;
	const zoomEnd = MAP_MAX_ZOOM;
	const zoomStep = 1 / MAP_ZOOM_SCALE;

	for (let zoom = zoomStart; zoom <= zoomEnd; zoom += zoomStep) {
		const scale = Math.pow(2, zoom);

		for (let i = 0; i < popups.length; i++) {
			const popup = popups[i];
			popup.expanded = popup.zoom < zoom;
			if (popup.expanded == false) continue;

			const angle = popup.angles.findLast((a) => a[0] < zoom)?.[1];
			if (angle == undefined) throw new Error('Angle not found');

			popup.angle = angle;
			popup.bounds = popup.getBounds(scale, angle);
		}

		for (let i = 0; i < popups.length; i++) {
			const popup1 = popups[i];
			if (popup1.bounds == undefined) continue;

			for (let j = i + 1; j < popups.length; j++) {
				const popup2 = popups[j];
				if (popup2.bounds == undefined) continue;

				if (areBoundsOverlaping(popup1.bounds, popup2.bounds)) {
					console.log('OVERLAP', zoom, data[i], data[j], popup1.angle, popup2.angle);

					const x11 = popup1.bounds.x - popup1.bounds.left;
					const y11 = popup1.bounds.y - popup1.bounds.top;
					const x12 = popup1.bounds.x + popup1.bounds.right;
					const y12 = popup1.bounds.y + popup1.bounds.bottom;
					console.log(`B1: (${x11}, ${y11}), (${x11}, ${y12}), (${x12}, ${y11}), (${x12}, ${y12})`);

					const x21 = popup2.bounds.x - popup2.bounds.left;
					const y21 = popup2.bounds.y - popup2.bounds.top;
					const x22 = popup2.bounds.x + popup2.bounds.right;
					const y22 = popup2.bounds.y + popup2.bounds.bottom;
					console.log(`B2: (${x21}, ${y21}), (${x21}, ${y22}), (${x22}, ${y21}), (${x22}, ${y22})`);

					throw new Error('Bounds overlaping');
				}
			}
		}
	}

	console.log(`[TEST ${data.length}] ${performance.now() - now}ms`);
}
