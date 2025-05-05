<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { sineInOut } from 'svelte/easing';

	import { getPositionParams } from '@workspace/shared/src/marker/position.js';
	import { MARKER_DEFAULT_ANGLE, MARKER_PADDING } from '@workspace/shared/src/constants.js';

	let { width, height }: { width: number; height: number } = $props();

	let anchor: HTMLElement;
	let marker: HTMLElement;
	let pin: HTMLElement;
	let body: HTMLElement;

	export const getBody = () => body;

	//#region Displayed

	let displayed = $state<boolean>(true);

	export function setDisplayed(value: boolean) {
		displayed = value;
	}

	export function getDisplayed() {
		return displayed;
	}

	//#endregion

	//#region Collapse

	let scale = 0;
	let scaleValue = 0;
	let scaleTween = new Tween(0, { easing: sineInOut });

	$effect(() => {
		scaleValue = scaleTween.current;
	});

	export function setCollapsed(value: boolean) {
		const scaleSet = value ? 0 : 1;
		if (scale == scaleSet) return;

		scale = scaleSet;
		scaleTween.set(scale, { duration: 200 });
		window.requestAnimationFrame(styleStep);
	}

	export function getCollapsed() {
		return scale == 0;
	}

	export function getExpanded() {
		return scale > 0;
	}

	//#endregion

	//#region Angle

	let angle = MARKER_DEFAULT_ANGLE;
	let angleValue = MARKER_DEFAULT_ANGLE;
	let angleTween = new Tween(MARKER_DEFAULT_ANGLE, {
		easing: sineInOut,
		interpolate: angleInterpolate
	});
	let angleDefined = false;

	$effect(() => {
		angleValue = angleTween.current;
	});

	function angleInterpolate(aDeg: number, bDeg: number) {
		if (Math.abs(bDeg - aDeg) < 180) {
			return (t: number) => aDeg + t * (bDeg - aDeg);
		} else {
			const distance = 360 - Math.abs(bDeg - aDeg);
			const direction = aDeg < bDeg ? -1 : 1;
			return (t: number) => (360 + aDeg + t * distance * direction) % 360;
		}
	}

	export function setAngle(value: number) {
		if (value != angle) {
			angle = value;
			if (angleDefined) {
				angleTween.set(value, { duration: 400 });
				window.requestAnimationFrame(styleStep);
			} else {
				angleTween.set(value, { duration: 0 });
				angleValue = value;
				styleStep();
			}
		}

		angleDefined = true;
	}

	//#endregion

	//#region Style

	$effect(() => {
		if (displayed == false) {
			scaleTween.set(scale, { duration: 0 });
			scaleValue = scale;

			angleTween.set(angle, { duration: 0 });
			angleValue = angle;

			updateStyle(angleValue, scaleValue);
		}
	});

	function styleStep() {
		if (angle != angleValue || scale != scaleValue) {
			updateStyle(angleValue, scaleValue);
			window.requestAnimationFrame(styleStep);
		}
	}

	function updateStyle(angle: number, scale: number) {
		if (!anchor || !marker || !pin) return;

		const params = getPositionParams(markerWidth, markerHeight, angle);

		const markerOffsetX = Math.round(params.markerOffsetX);
		const markerOffsetY = Math.round(params.markerOffsetY);
		marker.style.transform = `translate(${markerOffsetX}px, ${markerOffsetY}px)`;
		marker.style.scale = `${scale}`;

		const pinAngleDeg = params.pinAngleDeg;
		const pinSkewDeg = params.pinSkewDeg;
		pin.style.transform = `rotate(${pinAngleDeg}deg) skew(${pinSkewDeg}deg, ${pinSkewDeg}deg)`;
		pin.style.scale = `${scale}`;

		const shadowX = -1 - 2 * (markerOffsetX / markerWidth);
		const shadowY = -1 - 2 * (markerOffsetY / markerHeight);
		anchor.style.filter = `drop-shadow(0px 0px 4px rgba(0,0,0,0.4)) drop-shadow(${shadowX}px ${shadowY}px 2px rgba(0,0,0,0.4))`;
		anchor.style.opacity = `${scale}`;
	}

	//#endregion

	//#region Position

	let markerWidth = $state<number>(0);
	let markerHeight = $state<number>(0);

	$effect(() => {
		if (markerWidth && markerHeight) {
			pin.style.width = `${Math.min(markerWidth, markerHeight) / 4}px`;
			pin.style.height = `${Math.min(markerWidth, markerHeight) / 4}px`;
		}
	});

	$effect(() => {
		if (markerWidth && markerHeight) {
			updateStyle(angleValue, scaleValue);
		}
	});

	export const getWidth = () => markerWidth;
	export const getHeight = () => markerHeight;

	//#endregion
</script>

<div class="anchor" class:hidden={!displayed} bind:this={anchor}>
	<div class="pin" bind:this={pin}></div>
	<div class="marker" style:padding={MARKER_PADDING + 'px'} bind:this={marker} bind:clientWidth={markerWidth} bind:clientHeight={markerHeight}>
		<div class="body" style:width={`${width}px`} style:height={`${height}px`} bind:this={body}></div>
	</div>
</div>

<style lang="less">
	@background: var(--background);
	@border: var(--background);
	@border-width: 0px;

	.anchor {
		display: block;
		position: absolute;
		width: 0px;
		height: 0px;

		.marker {
			position: absolute;
			left: 0px;
			top: 0px;

			.body {
				display: flex;
				flex-direction: column;
				align-items: center;
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

	/* Transition properties */
	.anchor {
		transition-property: opacity;
		will-change: opacity;
		backface-visibility: hidden;

		.marker {
			transform-origin: 0% 0%;
			transform-style: preserve-3d;
			transition-property: scale;
			will-change: transform, scale;
		}

		.pin {
			transform-origin: 0% 0%;
			transition-property: scale;
			will-change: transform, scale;
		}
	}

	/* Hidden properties */
	.anchor {
		display: block;
	}

	.anchor.hidden {
		display: none;
		content-visibility: hidden;
	}
</style>
