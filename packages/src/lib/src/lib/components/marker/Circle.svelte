<script lang="ts">
	import { sineInOut } from 'svelte/easing';
	import { Tween } from 'svelte/motion';

	let circle: HTMLElement;

	let scale = 0;
	let scaleValue = 0;
	let scaleTween = new Tween(0, { easing: sineInOut });

	$effect(() => {
		scaleValue = scaleTween.current;
	});

	$effect(() => {
		updateStyle(scaleValue);
	});

	function styleStep() {
		if (scale != scaleValue) {
			updateStyle(scaleValue);
			window.requestAnimationFrame(styleStep);
		}
	}

	function updateStyle(scale: number) {
		circle.style.scale = `${scale}`;
		circle.style.filter = `brightness(${0.4 + 0.6 * scale})`;
	}

	export function setScale(value: number) {
		if (scale == value) return;

		scale = value;
		scaleTween.set(scale, { duration: 200 });
		window.requestAnimationFrame(styleStep);
	}

	//#endregion
</script>

<div class="circle" bind:this={circle}></div>

<style lang="less">
	@background: var(--background);
	@base: var(--primary);
	@circle-size: 16px;
	@border-size: 3px;

	.circle {
		position: absolute;
		left: -@circle-size * 0.5;
		top: -@circle-size * 0.5;
		width: @circle-size;
		height: @circle-size;
		border: @border-size solid @background;
		border-radius: 50%;
		background-color: @base;
		transform-origin: 50% 50%;
		transition-property: scale, filter;
		box-sizing: border-box;
		box-shadow: 0 2px 2px rgba(0, 0, 0, 0.5);
	}
</style>
