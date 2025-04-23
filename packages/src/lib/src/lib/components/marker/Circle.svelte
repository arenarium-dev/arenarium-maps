<script lang="ts">
	let collapsed = $state<boolean | undefined>(true);
	let distance = $state<number>(0);

	let size = $derived(1 - 0.5 * distance);
	let transform = $derived(collapsed ? '' : `scale(${size})`);
	let filter = $derived(collapsed ? '' : `grayscale(${0.5 * distance})`);
	let pulsing = $derived(collapsed ? '' : distance > 0 ? '' : 'pulsing');

	export function setCollapsed(value: boolean) {
		collapsed = value;
	}

	export function setDistance(value: number) {
		distance = Math.max(0, Math.min(1, value));
	}
</script>

<div class="circle" class:collapsed class:pulsing style:transform style:filter></div>

<style lang="less">
	@background: var(--background);
	@base: var(--primary);
	@circle-size: 16px;
	@border-size: 3px;

	.circle {
		position: absolute;
		left: -@circle-size * 0.5;
		top: -@circle-size * 0.5;
		width: @circle-size - 2 * @border-size;
		height: @circle-size - 2 * @border-size;
		border: @border-size solid @background;
		border-radius: 50%;
		background-color: @base;
		transform-origin: 50% 50%;
		transition-duration: 325ms;
		transition-timing-function: cubic-bezier(0.75, 0, 0.25, 1);
		transition-property: scale;
		scale: 1;
		box-shadow: 0 2px 2px rgba(0, 0, 0, 0.5);
	}

	.circle.collapsed {
		scale: 0;
	}

	.circle.pulsing {
		animation: pulse 1s infinite ease-in;
	}

	@keyframes pulse {
		0% {
			transform: scale(1);
			filter: brightness(1);
		}

		50% {
			transform: scale(1.25);
			filter: brightness(1.5);
		}

		100% {
			transform: scale(1);
			filter: brightness(1);
		}
	}
</style>
