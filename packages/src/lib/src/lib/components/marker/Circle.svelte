<script lang="ts">
	import { sineInOut } from 'svelte/easing';
	import { Tween } from 'svelte/motion';

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
			scale = 0;
			scaleTween.set(0, { duration: 0 });
			updateScaleStyle(0);
		}
	});

	function updateScaleStyle(scale: number) {
		if (!circle) return;

		window.requestAnimationFrame(() => {
			circle.style.scale = scale.toString();
			circle.style.filter = `brightness(${0.4 + 0.6 * scale})`;
		});
	}

	export function setScale(value: number) {
		if (value != scale) {
			scale = value;
			scaleTween.set(value, { duration: 75 });
		}
	}

	export function getInvisible() {
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
	@background: var(--map-style-background);
	@base: var(--map-style-primary);
	@circle-size: 16px;
	@padding-size: 3px;

	.circle {
		position: absolute;
		background-color: @background;
		padding: @padding-size;
		border-radius: @circle-size * 0.5;
		box-sizing: border-box;
		box-shadow: 0 2px 2px rgba(0, 0, 0, 0.5);
		transform-origin: 0% 0%;
		transform-style: preserve-3d;
		transform: translate(-50%, -50%);
		backface-visibility: hidden;

		.body {
			min-width: @circle-size - @padding-size * 2;
			min-height: @circle-size - @padding-size * 2;
			border-radius: @circle-size * 0.35;
			background-color: @base;
			overflow: hidden;
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
