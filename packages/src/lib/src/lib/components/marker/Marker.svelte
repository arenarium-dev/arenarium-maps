<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { sineInOut } from 'svelte/easing';
	import { type Snippet } from 'svelte';

	import { getPositionParams } from '@workspace/shared/src/marker/position.js';
	import { MARKER_DEFAULT_ANGLE, MARKER_PADDING } from '@workspace/shared/src/constants.js';

	let { children }: { children: Snippet } = $props();

	//#region State

	let collapsed = $state<boolean>(true);
	let hidden = $state<boolean>(false);

	export function setCollapsed(value: boolean) {
		collapsed = value;
	}

	export function setDisplayed(value: boolean) {
		hidden = !value;
	}

	export function getDisplayed() {
		return !hidden;
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
		if (hidden) {
			angleTween.set(angle, { duration: 0 });
			angleValue = angle;
			updateStyle(angleValue);
		}
	});

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

	function angleStep() {
		if (angle != angleValue) {
			updateStyle(angleValue);
			window.requestAnimationFrame(angleStep);
		}
	}

	export function setAngle(value: number) {
		if (value != angle) {
			angle = value;
			if (angleDefined) {
				angleTween.set(value, { duration: 400 });
				window.requestAnimationFrame(angleStep);
			} else {
				angleTween.set(value, { duration: 0 });
				angleValue = value;
				updateStyle(angleValue);
			}
		}

		angleDefined = true;
	}

	//#endregion

	//#region Position

	let markerWidth = $state<number>(0);
	let markerHeight = $state<number>(0);

	let anchor: HTMLElement;
	let marker: HTMLElement;
	let pin: HTMLElement;

	$effect(() => {
		if (markerWidth && markerHeight) {
			pin.style.width = `${Math.min(markerWidth, markerHeight) / 4}px`;
			pin.style.height = `${Math.min(markerWidth, markerHeight) / 4}px`;
		}
	});

	$effect(() => {
		if (markerWidth && markerHeight) {
			updateStyle(angleValue);
		}
	});

	function updateStyle(markerAngle: number) {
		if (!anchor || !marker || !pin) return;

		const params = getPositionParams(markerWidth, markerHeight, markerAngle);

		const markerOffsetX = Math.round(params.markerOffsetX);
		const markerOffsetY = Math.round(params.markerOffsetY);
		marker.style.transform = `translate(${markerOffsetX}px, ${markerOffsetY}px)`;

		const pinAngleDeg = params.pinAngleDeg;
		const pinSkewDeg = params.pinSkewDeg;
		pin.style.transform = `rotate(${pinAngleDeg}deg) skew(${pinSkewDeg}deg, ${pinSkewDeg}deg)`;

		const shadowX = -1 - 2 * (markerOffsetX / markerWidth);
		const shadowY = -1 - 2 * (markerOffsetY / markerHeight);
		anchor.style.filter = ` drop-shadow(0px 0px 4px rgba(0,0,0,0.5)) drop-shadow(${shadowX}px ${shadowY}px 2px rgba(0,0,0,0.5))`;
	}

	export const getWidth = () => markerWidth;
	export const getHeight = () => markerHeight;

	//#endregion
</script>

<div class="anchor" class:collapsed class:hidden bind:this={anchor}>
	<div class="pin" bind:this={pin}></div>
	<div
		class="marker"
		style:padding={MARKER_PADDING + 'px'}
		bind:this={marker}
		bind:clientWidth={markerWidth}
		bind:clientHeight={markerHeight}
	>
		<div class="popup">
			{@render children()}
		</div>
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

			.popup {
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
	@transition-duration: 250ms;
	@transition-timing-function: cubic-bezier(0.75, 0, 0.25, 1);

	.anchor {
		transition-duration: @transition-duration;
		transition-timing-function: @transition-timing-function;
		transition-property: opacity;
		will-change: opacity;

		.marker {
			transform-origin: 0% 0%;
			transform-style: preserve-3d;
			transition-duration: @transition-duration;
			transition-timing-function: @transition-timing-function;
			transition-property: scale;
			will-change: transform, scale;
		}

		.pin {
			transform-origin: 0% 0%;
			transition-duration: @transition-duration;
			transition-timing-function: @transition-timing-function;
			transition-property: scale;
			will-change: transform, scale;
		}
	}

	/* Collapsed properties */
	.anchor {
		opacity: 1;

		.marker {
			scale: 1;
		}

		.pin {
			scale: 1;
		}
	}

	.anchor.collapsed {
		opacity: 0;

		.marker {
			scale: 0;
		}

		.pin {
			scale: 0;
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
