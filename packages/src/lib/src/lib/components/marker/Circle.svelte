<script lang="ts">
	import { sineInOut } from 'svelte/easing';
	import { Tween } from 'svelte/motion';

	let circle: HTMLElement;
	let pin: HTMLElement;

	export const getPin = () => pin;

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

<div class="circle" bind:this={circle}>
	<div class="pin" bind:this={pin}>
		<div class="content"></div>
	</div>
</div>

<style lang="less">
	@background: var(--background);
	@base: var(--primary);
	@circle-size: 16px;
	@padding-size: 3px;

	.circle {
		position: absolute;
		background-color: @background;
		padding: @padding-size;
		border-radius: @circle-size * 0.5;
		transform: translate(-50%, -50%);
		transform-origin: 0% 0%;
		transform-style: preserve-3d;
		transition-property: scale, filter;
		box-sizing: border-box;
		box-shadow: 0 2px 2px rgba(0, 0, 0, 0.5);
		backface-visibility: hidden;

		.pin {
			background-color: @base;
			border-radius: @circle-size * 0.35;
			overflow: hidden;

			.content {
				width: @circle-size - @padding-size * 2;
				height: @circle-size - @padding-size * 2;
			}
		}
	}
</style>
