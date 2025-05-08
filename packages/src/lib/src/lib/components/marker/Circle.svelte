<script lang="ts">
	let pin: HTMLElement;

	let collapsed = $state<boolean>(true);
	let scale = $state<number>(0);

	let transform = $derived(`translate(-50%, -50%) scale(${scale})`);
	let filter = $derived(`brightness(${0.4 + 0.6 * scale})`);

	export function setCollapsed(value: boolean) {
		collapsed = value;
	}

	export function setScale(value: number) {
		scale = value;
	}

	export function getPin() {
		return pin;
	}
</script>

<div class="circle" class:collapsed style:transform style:filter>
	<div class="pin" bind:this={pin}></div>
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
		box-sizing: border-box;
		box-shadow: 0 2px 2px rgba(0, 0, 0, 0.5);
		transform-origin: 0% 0%;
		transform-style: preserve-3d;
		transform: translate(-50%, -50%);
		backface-visibility: hidden;

		.pin {
			min-width: @circle-size - @padding-size * 2;
			min-height: @circle-size - @padding-size * 2;
			border-radius: @circle-size * 0.35;
			background-color: @base;
			overflow: hidden;
		}
	}

	// Collapsed properties

	.circle {
		scale: 1;

		transition-duration: 125ms;
		transition-timing-function: ease-in-out;
		transition-property: scale;

		&.collapsed {
			scale: 0;
		}
	}
</style>
