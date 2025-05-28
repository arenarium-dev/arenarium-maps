<script lang="ts">
	import { sineInOut } from 'svelte/easing';
	import { Tween } from 'svelte/motion';

	import { animation } from '../../map/animation.js';

	let { id, priority }: { id: string; priority: number } = $props();

	let circle: HTMLElement;
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

	let scale = 0;
	let scaleTween = new Tween(0, { easing: sineInOut });

	$effect(() => {
		updateScaleStyle(scaleTween.current);
	});

	$effect(() => {
		if (displayed == false) {
			scaleTween.set(scale, { duration: 0 });
			updateScaleStyle(scale);
		}
	});

	function updateScaleStyle(scale: number) {
		if (!circle) return;

		animation.equeue(id, priority, () => {
			circle.style.scale = scale.toString();
			circle.style.filter = `brightness(${0.25 + 0.75 * scale})`;
			body.style.opacity = scale.toString();
		});
	}

	export function setScale(value: number) {
		if (value != scale) {
			scale = value;
			scaleTween.set(value, { duration: 75 / animation.speed() });
		}
	}

	export function getCollapsed() {
		return scaleTween.current == 0;
	}

	export function getScale() {
		return scale;
	}

	//#endregion
</script>

<div class="circle" class:displayed bind:this={circle}>
	<div class="body" bind:this={body}></div>
</div>

<style lang="less">
	@circle-size: 16px;
	@padding-size: 2px;
	@max-size: 64px;

	.circle {
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
			min-width: @circle-size - @padding-size * 2;
			min-height: @circle-size - @padding-size * 2;
			border-radius: @max-size;
			background-color: var(--map-style-primary);
			overflow: hidden;
			will-change: opacity;
		}
	}

	// Scale properties

	.circle {
		scale: 0;
		filter: brightness(0);
	}

	// Displayed properties

	.circle {
		display: none;
		content-visibility: hidden;
	}

	.circle.displayed {
		display: initial;
		content-visibility: initial;
	}
</style>
