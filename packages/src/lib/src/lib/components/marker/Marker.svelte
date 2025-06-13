<script lang="ts">
	import { sineIn, sineInOut, sineOut } from 'svelte/easing';

	import { animation, ANIMATION_MARKER_LAYER, ANIMATION_PRIORITY_LAYER } from '../../map/animation/animation.js';
	import { Transition } from '../../map/animation/transition.js';

	import { Rectangle } from '@workspace/shared/src/popup/rectangle.js';

	let { id, priority, width, height, padding }: { id: string; priority: number; width: number; height: number; padding: number } = $props();

	let anchor: HTMLElement;
	let marker: HTMLElement;
	let pin: HTMLElement;
	let body: HTMLElement;

	const markerWidth = width + 2 * padding;
	const markerHeight = height + 2 * padding;

	export const getBody = () => body;

	//#region Position

	$effect(() => {
		pin.style.width = `${Math.min(markerWidth, markerHeight) / 4}px`;
		pin.style.height = `${Math.min(markerWidth, markerHeight) / 4}px`;
	});

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
		return scaleTransition.motion.current == 0;
	}

	export function getExpanded() {
		return collapsed == false;
	}

	//#endregion

	//#region Scale

	let scaleTransition = new Transition(0);
	let scalePriority = ANIMATION_MARKER_LAYER;

	$effect(() => {
		updateScaleStyle(scaleTransition.motion.current);
	});

	$effect(() => {
		if (displayed == false) {
			scaleTransition.snap();
			animation.clear(priority, id + '_scale');
		}
	});

	$effect(() => {
		if (collapsed == true && scaleTransition.value != 0) {
			scalePriority = ANIMATION_PRIORITY_LAYER;

			if (animation.stacked()) {
				scaleTransition.set(0, { duration: 0 });
			} else {
				scaleTransition.set(0, { duration: 150, easing: sineIn });
			}
		}

		if (collapsed == false && scaleTransition.value != 1) {
			scalePriority = ANIMATION_MARKER_LAYER;

			scaleTransition.set(1, { duration: 150, easing: sineOut });
		}
	});

	function updateScaleStyle(scale: number) {
		if (!anchor || !marker || !pin) return;

		animation.equeue(scalePriority, priority, id + '_scale', () => {
			anchor.style.opacity = `${scale}`;
			marker.style.scale = `${scale}`;
			pin.style.scale = `${scale}`;
		});
	}

	//#region Angle

	let angle = NaN;
	let angleDefined = $state<boolean>(false);

	let markerOffsetXTransition = new Transition(-markerWidth / 2, { easing: sineInOut });
	let markerOffsetYTransition = new Transition(-markerHeight / 2, { easing: sineInOut });

	$effect(() => {
		updateAngleStyle(markerOffsetXTransition.motion.current, markerOffsetYTransition.motion.current);
	});

	$effect(() => {
		if (displayed == false) {
			markerOffsetXTransition.snap();
			markerOffsetXTransition.snap();
			animation.clear(priority, id + '_angle');
		}
	});

	$effect(() => {
		if (collapsed == true && angleDefined) {
			markerOffsetXTransition.update({ duration: 75 });
			markerOffsetXTransition.update({ duration: 75 });
		}
	});

	function updateAngleStyle(markerOffsetX: number, markerOffsetY: number) {
		if (!anchor || !marker || !pin) return;

		const markerCenterX = markerOffsetX + markerWidth / 2;
		const markerCenterY = markerOffsetY + markerHeight / 2;

		// Pin center is the center of the circle in the marker
		const pinCenterX = markerHeight < markerWidth ? (markerCenterX * markerHeight) / markerWidth : markerCenterX;
		const pinCenterY = markerHeight > markerWidth ? (markerCenterY * markerWidth) / markerHeight : markerCenterY;

		// Calculate pin angle, it point to the center of the inverse width/height rectangle of the marker
		const pinAngleRad = Math.atan2(pinCenterY, pinCenterX);
		const pinAngleDeg = (pinAngleRad / Math.PI) * 180 - 45;

		// Calculate pin skew, its is lower (ak. wider) the closer the pin is to the center of the marker
		const pinMinSkew = 0;
		const pinMaxSkew = 30;

		const pinCenterDistance = Math.sqrt(markerCenterX * markerCenterX + markerCenterY * markerCenterY);
		const pinCenterMinDistance = Math.min(markerWidth, markerHeight) / 2;
		const pinCenterMaxDistance = Math.sqrt(markerWidth * markerWidth + markerHeight * markerHeight) / 2;

		const pinSkewRatio = (pinCenterDistance - pinCenterMinDistance) / (pinCenterMaxDistance - pinCenterMinDistance);
		const pinSkewDeg = pinMinSkew + pinSkewRatio * (pinMaxSkew - pinMinSkew);
		const pinScale = pinCenterDistance < pinCenterMinDistance ? pinCenterDistance / pinCenterMinDistance : 1;

		animation.equeue(ANIMATION_MARKER_LAYER, priority, id + '_angle', () => {
			marker.style.transform = `translate(${Math.round(markerOffsetX)}px, ${Math.round(markerOffsetY)}px)`;
			pin.style.transform = `scale(${pinScale}) rotate(${pinAngleDeg}deg) skew(${pinSkewDeg}deg, ${pinSkewDeg}deg)`;
		});
	}

	export function setAngle(value: number) {
		if (angleDefined == false) {
			let angleOffsets = Rectangle.getOffsets(markerWidth, markerHeight, value);
			markerOffsetXTransition.set(Math.round(angleOffsets.offsetX), { duration: 0 });
			markerOffsetYTransition.set(Math.round(angleOffsets.offsetY), { duration: 0 });
			updateAngleStyle(markerOffsetXTransition.value, markerOffsetYTransition.value);

			angle = value;
			angleDefined = true;
		} else if (value != angle) {
			let angleDistance = Math.abs(value - angle);
			let angleSteps = angleDistance < 180 ? angleDistance : 360 - angleDistance;
			let angleDuration = Math.log(angleSteps) * 75;

			let angleOffsets = Rectangle.getOffsets(markerWidth, markerHeight, value);
			markerOffsetXTransition.set(Math.round(angleOffsets.offsetX), { duration: angleDuration });
			markerOffsetYTransition.set(Math.round(angleOffsets.offsetY), { duration: angleDuration });

			angle = value;
		}
	}

	//#endregion
</script>

<div class="anchor" class:displayed bind:this={anchor}>
	<div class="pin" bind:this={pin}></div>
	<div class="marker" style:padding={padding + 'px'} bind:this={marker}>
		<div class="body" style:width={`${width}px`} style:height={`${height}px`} bind:this={body}></div>
	</div>
</div>

<style lang="less">
	@background: var(--map-style-background);
	@border: var(--map-style-background);

	.anchor {
		display: block;
		position: absolute;
		width: 0px;
		height: 0px;
		filter: drop-shadow(0px 2px 2px rgba(0, 0, 0, 0.5));

		.marker {
			position: absolute;
			left: 0px;
			top: 0px;

			.body {
				position: relative;
				border-radius: 12px;
				background-color: @background;
				overflow: hidden;
				cursor: pointer;
			}
		}

		.pin {
			position: absolute;
			left: 0px;
			top: 0px;
			border-radius: 2px;
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
