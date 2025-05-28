<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { sineIn, sineInOut, sineOut } from 'svelte/easing';

	import { animation } from '../../map/animation.js';

	import { getRectangleOffsets } from '@workspace/shared/src/marker/rectangle.js';
	import { ANIMATION_PRIORITY_LAYER, MARKER_DEFAULT_ANGLE, MARKER_PADDING } from '@workspace/shared/src/constants.js';

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
		updateScaleStyle(scaleTween.current);
	});

	$effect(() => {
		if (displayed == false) {
			scaleTween.set(scale, { duration: 0 });
			updateScaleStyle(scale);
		}
	});

	$effect(() => {
		if (collapsed == true && scale != 0) {
			scale = 0;

			if (animation.stacked()) {
				scaleTween.set(0, { duration: 0 });
				updateScaleStyle(0);
			} else {
				scaleTween.set(0, { duration: 150 / animation.speed(), easing: sineIn });
			}
		}

		if (collapsed == false && scale != 1) {
			scale = 1;
			scaleTween.set(1, { duration: 150, easing: sineOut });
		}
	});

	function updateScaleStyle(scale: number) {
		if (!anchor || !marker || !pin) return;

		animation.equeue(id + '_scale', priority + ANIMATION_PRIORITY_LAYER, () => {
			anchor.style.opacity = `${scale}`;
			marker.style.scale = `${scale}`;
			pin.style.scale = `${scale}`;
		});
	}

	//#region Angle

	let angle = MARKER_DEFAULT_ANGLE;
	let angleDefined = false;
	let angleTween = new Tween(MARKER_DEFAULT_ANGLE, {
		easing: sineInOut,
		interpolate: getAngleInterpolate
	});

	$effect(() => {
		updateAngleStyle(angleTween.current);
	});

	$effect(() => {
		if (displayed == false) {
			angleTween.set(angle, { duration: 0 });
			updateAngleStyle(angle);
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

	function updateAngleStyle(angle: number) {
		if (!anchor || !marker || !pin) return;

		const width = markerWidth;
		const height = markerHeight;

		// Calculate marker offsets, its values are such that the rectnagle edge always touches the center anchor
		const markerOffsets = getRectangleOffsets(width, height, angle);
		const markerOffsetX = markerOffsets.offsetX;
		const markerOffsetY = markerOffsets.offsetY;

		// Calculate pin angle, it point to the center of the inverse width/height rectangle of the marker
		const pinRectWidth = height;
		const pinRectHeight = width;

		const pinRectOffsets = getRectangleOffsets(pinRectWidth, pinRectHeight, angle);
		const pinCenterX = pinRectWidth / 2 + pinRectOffsets.offsetX;
		const pinCenterY = pinRectHeight / 2 + pinRectOffsets.offsetY;
		const pinAngleRad = Math.atan2(pinCenterY, pinCenterX);
		const pinAngleDeg = (pinAngleRad / Math.PI) * 180 - 45;

		// Calculate pin skew, its is lower (ak. wider) the closer the pin is to the center of the marker
		const pinMinSkew = 0;
		const pinMaxSkew = 30;

		const markerCenterX = markerOffsetX + width / 2;
		const markerCenterY = markerOffsetY + height / 2;

		const pinCenterDistance = Math.sqrt(markerCenterX * markerCenterX + markerCenterY * markerCenterY);
		const pinCenterMinDistance = Math.min(width, height) / 2;
		const pinCenterMaxDistance = Math.sqrt(width * width + height * height) / 2;

		const pinSkewRatio = (pinCenterDistance - pinCenterMinDistance) / (pinCenterMaxDistance - pinCenterMinDistance);
		const pinSkewDeg = pinMinSkew + pinSkewRatio * (pinMaxSkew - pinMinSkew);

		animation.equeue(id + '_angle', priority, () => {
			marker.style.transform = `translate(${Math.round(markerOffsetX)}px, ${Math.round(markerOffsetY)}px)`;
			pin.style.transform = `rotate(${pinAngleDeg}deg) skew(${pinSkewDeg}deg, ${pinSkewDeg}deg)`;
		});
	}

	export function setAngle(value: number) {
		if (displayed == false) {
			angle = value;
			updateAngleStyle(angle);
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
