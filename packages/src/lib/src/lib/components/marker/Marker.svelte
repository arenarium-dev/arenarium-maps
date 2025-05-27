<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { sineIn, sineInOut, sineOut } from 'svelte/easing';

	import { animation } from '../../map/animation.js';

	import { getPositionParams } from '@workspace/shared/src/marker/position.js';
	import { MARKER_DEFAULT_ANGLE, MARKER_PADDING } from '@workspace/shared/src/constants.js';

	let { id, priority, width, height }: { id: string; priority: number; width: number; height: number } = $props();

	let anchor: HTMLElement;
	let marker: HTMLElement;
	let pin: HTMLElement;
	let body: HTMLElement;

	let markerWidth = $state<number>(0);
	let markerHeight = $state<number>(0);

	export const getBody = () => body;

	//#region Position

	$effect(() => {
		if (markerWidth && markerHeight) {
			pin.style.width = `${Math.min(markerWidth, markerHeight) / 4}px`;
			pin.style.height = `${Math.min(markerWidth, markerHeight) / 4}px`;
		}
	});

	export const getWidth = () => markerWidth;
	export const getHeight = () => markerHeight;

	//#endregion

	//#region Displayed

	let displayed = $state<boolean>(true);

	export function setDisplayed(value: boolean) {
		displayed = value;
	}

	export function getDisplayed() {
		return displayed;
	}

	//#endregion

	//#region Collapsed

	let collapsed = $state<boolean>(true);

	export function setCollapsed(value: boolean) {
		collapsed = value;
	}

	export function getCollapsed() {
		return scaleTween.current == 0;
	}

	export function getExpanded() {
		return collapsed == false;
	}

	//#endregion

	//#region Scale

	let scale = 0;
	let scaleTween = new Tween(scale);

	$effect(() => {
		if (displayed == false) {
			scaleTween.set(scale, { duration: 0 });
		}
	});

	$effect(() => {
		if (collapsed == true && scale != 0) {
			scale = 0;
			scaleTween.set(0, { duration: 75, easing: sineIn });
		}

		if (collapsed == false && scale != 1) {
			scale = 1;
			scaleTween.set(1, { duration: 150, easing: sineOut });
		}
	});

	//#region Angle

	let angle = MARKER_DEFAULT_ANGLE;
	let angleDefined = false;
	let angleTween = new Tween(MARKER_DEFAULT_ANGLE, {
		easing: sineInOut,
		interpolate: getAngleInterpolate
	});

	$effect(() => {
		if (displayed == false) {
			angleTween.set(angle, { duration: 0 });
		}
	});

	$effect(() => {
		if (collapsed == true) {
			angleTween.set(angle, { duration: 75 });
		}
	});

	function getAngleInterpolate(aDeg: number, bDeg: number) {
		if (Math.abs(bDeg - aDeg) < 180) {
			return (t: number) => aDeg + t * (bDeg - aDeg);
		} else {
			const distance = 360 - Math.abs(bDeg - aDeg);
			const direction = aDeg < bDeg ? -1 : 1;
			return (t: number) => (360 + aDeg + t * distance * direction) % 360;
		}
	}

	export function setAngle(value: number) {
		if (displayed == false) {
			angle = value;
			updateStyle(markerWidth, markerHeight, scale, angle);
		}

		if (value != angle) {
			let angleDistance = Math.abs(value - angleTween.current);
			let angleSteps = angleDistance < 180 ? angleDistance : 360 - angleDistance;
			let angleDuration = Math.log(angleSteps) * 75;

			angle = value;
			angleTween.set(value, { duration: angleDefined ? angleDuration : 0 });
		}

		angleDefined = true;
	}

	//#endregion

	//#region Style

	$effect(() => {
		updateStyle(markerWidth, markerHeight, scaleTween.current, angleTween.current);
	});

	function updateStyle(width: number, height: number, scale: number, angle: number) {
		if (!anchor || !marker || !pin) return;

		const params = getPositionParams(width, height, angle);

		animation.equeue(id, priority, () => {
			anchor.style.opacity = `${scale}`;

			const markerOffsetX = Math.round(params.markerOffsetX);
			const markerOffsetY = Math.round(params.markerOffsetY);
			marker.style.transform = `translate(${markerOffsetX}px, ${markerOffsetY}px)`;
			marker.style.scale = `${scale}`;

			const pinAngleDeg = params.pinAngleDeg;
			const pinSkewDeg = params.pinSkewDeg;
			pin.style.transform = `rotate(${pinAngleDeg}deg) skew(${pinSkewDeg}deg, ${pinSkewDeg}deg)`;
			pin.style.scale = `${scale}`;
		});
	}

	//#endregion
</script>

<div class="anchor" class:displayed bind:this={anchor}>
	<div class="pin" bind:this={pin}></div>
	<div class="marker" style:padding={MARKER_PADDING + 'px'} bind:this={marker} bind:clientWidth={markerWidth} bind:clientHeight={markerHeight}>
		<div class="body" style:width={`${width}px`} style:height={`${height}px`} bind:this={body}></div>
	</div>
</div>

<style lang="less">
	@background: var(--map-style-background);
	@border: var(--map-style-background);
	@border-width: 0px;

	.anchor {
		display: block;
		position: absolute;
		width: 0px;
		height: 0px;
		filter: drop-shadow(0px 0px 4px rgba(0, 0, 0, 0.5));

		.marker {
			position: absolute;
			left: 0px;
			top: 0px;

			.body {
				border-radius: 12px;
				border-style: solid;
				border-width: @border-width;
				border-color: @border;
				background-color: @background;
				overflow: hidden;
				cursor: pointer;
			}
		}

		.pin {
			position: absolute;
			left: 0px;
			top: 0px;
			width: 50%;
			height: 50%;
			background-color: @border;
			transform-origin: 0% 0%;
		}
	}

	// Hover properties

	.anchor:hover {
		transform-style: preserve-3d;
		backface-visibility: hidden;

		.marker {
			transform-style: preserve-3d;
			backface-visibility: hidden;
		}
	}

	// Transition properties

	.anchor {
		opacity: 0;
		will-change: opacity;

		.marker {
			scale: 0;
			transform-origin: 0% 0%;
			will-change: transform, scale;
		}

		.pin {
			scale: 0;
			transform-origin: 0% 0%;
			will-change: transform, scale;
		}
	}

	// Displayed properties

	.anchor {
		display: none;
		content-visibility: hidden;
	}

	.anchor.displayed {
		display: initial;
		content-visibility: initial;
	}
</style>
