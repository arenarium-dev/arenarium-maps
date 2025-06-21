<script lang="ts">
	import { sineIn, sineInOut, sineOut } from 'svelte/easing';

	import { animation } from '../../map/animation/animation.js';
	import { Transition } from '../../map/animation/transition.js';

	import { Rectangle } from '@workspace/shared/src/tooltip/rectangle.js';

	let {
		id,
		priority,
		layer,
		width,
		height,
		margin,
		radius
	}: {
		id: string;
		priority: number;
		layer: number;
		width: number;
		height: number;
		margin: number;
		radius: number;
	} = $props();

	let anchor: HTMLElement;
	let bubble: HTMLElement;
	let pointer: HTMLElement;
	let body: HTMLElement;

	const tooltipWidth = width + 2 * margin;
	const tooltipHeight = height + 2 * margin;

	export const getBody = () => body;

	//#region Position

	$effect(() => {
		pointer.style.width = `${margin * 4}px`;
		pointer.style.height = `${margin * 4}px`;
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
			if (animation.stacked()) {
				scaleTransition.set(0, { duration: 0 });
			} else {
				scaleTransition.set(0, { duration: 150, easing: sineIn });
			}
		}

		if (collapsed == false && scaleTransition.value != 1) {
			scaleTransition.set(1, { duration: 150, easing: sineOut });
		}
	});

	function updateScaleStyle(scale: number) {
		if (!anchor || !bubble || !pointer) return;

		animation.equeue(collapsed ? 0 : layer, priority, id + '_scale', () => {
			anchor.style.opacity = `${scale}`;
			bubble.style.scale = `${scale}`;
			pointer.style.scale = `${scale}`;
		});
	}

	//#region Angle

	let angle = NaN;
	let angleDefined = $state<boolean>(false);

	let bubbleOffsetXTransition = new Transition(-tooltipWidth / 2, { easing: sineInOut });
	let bubbleOffsetYTransition = new Transition(-tooltipHeight / 2, { easing: sineInOut });

	$effect(() => {
		updateAngleStyle(bubbleOffsetXTransition.motion.current, bubbleOffsetYTransition.motion.current);
	});

	$effect(() => {
		if (displayed == false) {
			bubbleOffsetXTransition.snap();
			bubbleOffsetXTransition.snap();
			animation.clear(priority, id + '_angle');
		}
	});

	$effect(() => {
		if (collapsed == true && angleDefined) {
			bubbleOffsetXTransition.update({ duration: 75 });
			bubbleOffsetXTransition.update({ duration: 75 });
		}
	});

	function updateAngleStyle(offsetX: number, offsetY: number) {
		if (!anchor || !bubble || !pointer) return;

		const tooltipCenterX = offsetX + tooltipWidth / 2;
		const tooltipCenterY = offsetY + tooltipHeight / 2;

		// Pointer center is the center of the circle in the tooltip
		const pointerCenterX = tooltipHeight < tooltipWidth ? (tooltipCenterX * tooltipHeight) / tooltipWidth : tooltipCenterX;
		const pointerCenterY = tooltipHeight > tooltipWidth ? (tooltipCenterY * tooltipWidth) / tooltipHeight : tooltipCenterY;

		// Calculate pointer angle, it point to the center of the inverse width/height rectangle of the tooltip
		const pointerAngleRad = Math.atan2(pointerCenterY, pointerCenterX);
		const pointerAngleDeg = (pointerAngleRad / Math.PI) * 180 - 45;

		// Calculate pointer skew, its is lower (ak. wider) the closer the pointer is to the center of the tooltip
		const pointerMinSkew = 0;
		const pointerMaxSkew = 30;

		const pointerCenterDistance = Math.sqrt(pointerCenterX * pointerCenterX + pointerCenterY * pointerCenterY);
		const pointerCenterMinDistance = Math.min(tooltipWidth, tooltipHeight) / 2;
		const pointerCenterMaxDistance = pointerCenterMinDistance * Math.SQRT2;

		const pointerSkewRatio = (pointerCenterDistance - pointerCenterMinDistance) / (pointerCenterMaxDistance - pointerCenterMinDistance);
		const pointerSkewDeg = pointerMinSkew + pointerSkewRatio * (pointerMaxSkew - pointerMinSkew);
		const pointerScale = pointerCenterDistance < pointerCenterMinDistance ? pointerCenterDistance / pointerCenterMinDistance : 1;

		animation.equeue(layer, priority, id + '_angle', () => {
			bubble.style.transform = `translate(${Math.round(offsetX)}px, ${Math.round(offsetY)}px)`;
			pointer.style.transform = `scale(${pointerScale}) rotate(${pointerAngleDeg}deg) skew(${pointerSkewDeg}deg, ${pointerSkewDeg}deg)`;
		});
	}

	export function setAngle(value: number) {
		if (angleDefined == false) {
			let angleOffsets = Rectangle.getOffsets(tooltipWidth, tooltipHeight, value);
			bubbleOffsetXTransition.set(Math.round(angleOffsets.offsetX), { duration: 0 });
			bubbleOffsetYTransition.set(Math.round(angleOffsets.offsetY), { duration: 0 });
			updateAngleStyle(bubbleOffsetXTransition.value, bubbleOffsetYTransition.value);

			angle = value;
			angleDefined = true;
		} else if (value != angle) {
			let angleDistance = Math.abs(value - angle);
			let angleSteps = angleDistance < 180 ? angleDistance : 360 - angleDistance;
			let angleDuration = Math.log(angleSteps) * 75;

			let angleOffsets = Rectangle.getOffsets(tooltipWidth, tooltipHeight, value);
			bubbleOffsetXTransition.set(Math.round(angleOffsets.offsetX), { duration: angleDuration });
			bubbleOffsetYTransition.set(Math.round(angleOffsets.offsetY), { duration: angleDuration });

			angle = value;
		}
	}

	//#endregion
</script>

<div class="anchor" class:displayed bind:this={anchor}>
	<div class="pointer" bind:this={pointer}></div>
	<div class="bubble" style:padding={margin + 'px'} bind:this={bubble}>
		<div class="body" style:width={`${width}px`} style:height={`${height}px`} style:border-radius={radius + 'px'} bind:this={body}></div>
	</div>
</div>

<style lang="less">
	@background: var(--arenarium-maps-tooltip-background, white);
	@shadow: var(--arenarium-maps-tooltip-shadow, 0px 2px 2px rgba(0, 0, 0, 0.5));

	.anchor {
		display: block;
		position: absolute;
		width: 0px;
		height: 0px;
		filter: drop-shadow(@shadow);

		.bubble {
			position: absolute;
			left: 0px;
			top: 0px;

			.body {
				position: relative;
				background-color: @background;
				overflow: hidden;
				cursor: pointer;
			}
		}

		.pointer {
			position: absolute;
			left: 0px;
			top: 0px;
			background-color: @background;
			transform-origin: 0% 0%;
		}
	}

	// Hover properties

	.anchor:hover {
		transform-style: preserve-3d;
		backface-visibility: hidden;

		.bubble {
			transform-style: preserve-3d;
			backface-visibility: hidden;
		}
	}

	// Transition properties

	.anchor {
		opacity: 0;
		will-change: opacity;

		.bubble {
			scale: 0;
			transform-origin: 0% 0%;
			will-change: transform, scale;
		}

		.pointer {
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
