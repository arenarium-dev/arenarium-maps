<script lang="ts">
	import { sineInOut } from 'svelte/easing';

	import { animation, ANIMATION_PIN_LAYER } from '../../map/animation/animation.js';
	import { Transition } from '../../map/animation/transition.js';

	let { id, priority }: { id: string; priority: number } = $props();

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

		animation.equeue(ANIMATION_PIN_LAYER, priority, id, () => {
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

<div class="pin" class:displayed bind:this={pin}>
	<div class="body" bind:this={body}></div>
</div>

<style lang="less">
	@padding-size: 2px;
	@min-size: 16px;
	@max-size: 64px;

	.pin {
		max-width: @max-size;
		max-height: @max-size;
		position: absolute;
		background-color: var(--map-style-background);
		padding: @padding-size;
		border-radius: @max-size;
		box-sizing: border-box;
		box-shadow: 0 2px 2px rgba(0, 0, 0, 0.5);
		transform-origin: 0% 0%;
		transform-style: preserve-3d;
		transform: translate(-50%, -50%);
		backface-visibility: hidden;
		will-change: scale;

		.body {
			min-width: @min-size - @padding-size * 2;
			min-height: @min-size - @padding-size * 2;
			border-radius: @max-size;
			background-color: var(--map-style-primary);
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
