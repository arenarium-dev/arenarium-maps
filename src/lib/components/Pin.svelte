<script lang="ts">
	import { sineInOut } from 'svelte/easing';

	import { animation } from '../map/animation/animation.js';
	import { Transition } from '../map/animation/transition.js';

	let {
		id,
		priority,
		layer,
		width,
		height,
		radius
	}: {
		id: string;
		priority: number;
		layer: number;
		width: number;
		height: number;
		radius: number;
	} = $props();

	let pin: HTMLElement;
	let body: HTMLElement;

	export function getBody() {
		return body;
	}

	//#region Displayed

	let displayed = $state<boolean>(false);

	export function setDisplayed(value: boolean) {
		displayed = value;
	}

	export function getDisplayed() {
		return displayed;
	}

	//#endregion

	//#region Scale

	let scaleTransition = new Transition(0, { easing: sineInOut });

	$effect(() => {
		updateScaleStyle(scaleTransition.motion.current);
	});

	$effect(() => {
		if (displayed == false) {
			scaleTransition.snap();
			animation.clear(priority, id);
		}
	});

	function updateScaleStyle(scale: number) {
		if (!pin) return;

		animation.equeue(layer, priority, id, () => {
			pin.style.scale = scale.toString();
			pin.style.filter = `brightness(${0.25 + 0.75 * scale})`;
			body.style.opacity = scale.toString();
		});
	}

	export function setScale(value: number) {
		if (value != scaleTransition.value) {
			scaleTransition.set(value, { duration: 75 });
		}
	}

	export function getCollapsed() {
		return scaleTransition.motion.current == 0;
	}

	export function getScale() {
		return scaleTransition.value;
	}

	//#endregion
</script>

<div class="pin" class:displayed bind:this={pin} style:width={`${width}px`} style:height={`${height}px`} style:border-radius={`${radius}px`}>
	<div class="body" bind:this={body} style:width={`${width - 4}px`} style:height={`${height - 4}px`} style:border-radius={`${radius - 2}px`}></div>
</div>

<style lang="less">
	@background: var(--arenarium-maps-pin-background, darkgreen);
	@border: var(--arenarium-maps-pin-border, white);
	@shadow: var(--arenarium-maps-pin-shadow, 0px 2px 2px rgba(0, 0, 0, 0.5));
	@padding-size: 2px;

	.pin {
		position: absolute;
		background-color: @border;
		padding: @padding-size;
		box-sizing: border-box;
		box-shadow: @shadow;
		transform-origin: 0% 0%;
		transform-style: preserve-3d;
		transform: translate(-50%, -50%);
		backface-visibility: hidden;
		will-change: scale;

		.body {
			background-color: @background;
			overflow: hidden;
			will-change: opacity;
		}
	}

	// Scale properties

	.pin {
		scale: 0;
		filter: brightness(0);
	}

	// Displayed properties

	.pin {
		display: none;
		content-visibility: hidden;
	}

	.pin.displayed {
		display: initial;
		content-visibility: initial;
	}
</style>
