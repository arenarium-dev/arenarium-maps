<script lang="ts">
	import { fade } from 'svelte/transition';

	import { onMount, untrack, type Snippet } from 'svelte';

	// Props
	let {
		axis = 'y',
		padding = 12,
		onShow,
		onHide,
		content,
		popover
	}: {
		axis?: 'x' | 'y';
		padding?: number;
		onShow?: Function;
		onHide?: Function;
		content: Snippet;
		popover: Snippet;
	} = $props();

	// Export
	export const show = () => (isShown = true);
	export const hide = () => (isShown = false);
	export const visible = () => isShown;

	// Bindings
	let contentElement = $state<HTMLElement>();
	let popoverElement = $state<HTMLElement>();

	// State
	let popoverTop = $state<number>(0);
	let popoverLeft = $state<number>(0);
	let isShown = $state<boolean>(false);

	$effect(() => {
		if (!popoverElement) {
			// Popover has been hidden by some means
			isShown = false;
		}
	});

	$effect(() => {
		if (isShown) {
			untrack(() => setPopoverPosition());
		}
	});

	$effect(() => {
		if (isShown) {
			if (onShow) onShow();
		} else {
			if (onHide) onHide();
		}
	});

	function setPopoverPosition() {
		if (!contentElement || !popoverElement) return;

		const minLeft = padding;
		const maxRight = window.innerWidth - padding;
		const minTop = padding;
		const maxBottom = window.innerHeight - padding;

		const contentRect = contentElement.getBoundingClientRect();
		const popoverRect = popoverElement.getBoundingClientRect();

		switch (axis) {
			case 'x': {
				// Calculate popover left
				let left = contentRect.right;
				// Check if popover can be adjusted to fit in window
				if (popoverRect.width < maxRight - minLeft - contentRect.width) {
					// Check if popover is overflowing to the right
					if (contentRect.right + popoverRect.width > maxRight) {
						left = -popoverRect.width;
					}
				}

				// Calculate popover top
				let top = contentRect.top;
				if (popoverRect.height < maxBottom - minTop) {
					// Check if popover is overflowing to the bottom
					if (top + popoverRect.height > maxBottom) {
						top = maxBottom - (top + popoverRect.height);
					}
				}

				// Set relative coordinates
				popoverLeft = left;
				popoverTop = top;
				break;
			}
			case 'y': {
				// Calculate popover left
				let left = contentRect.left;
				// Check if popover can be adjusted to fit in window
				if (popoverRect.width < maxRight - minLeft) {
					// Check if popover is overflowing to the right
					if (left + popoverRect.width > maxRight) {
						left += maxRight - (left + popoverRect.width);
					}
				}

				// Calculate popover top
				let top = contentRect.bottom;
				// Check if popover can be adjusted to fit in window
				if (popoverRect.height < maxBottom - minTop - contentRect.height) {
					// Check if popover is overflowing to the bottom
					if (top + popoverRect.height > maxBottom) {
						top += -popoverRect.height;
					}
				}

				// Set relative coordinates
				popoverLeft = left;
				popoverTop = top;
				break;
			}
		}
	}

	// Window
	onMount(() => {
		window.addEventListener('scroll', onWindowScroll, { capture: true });

		return () => {
			window.removeEventListener('scroll', onWindowScroll, { capture: true });
		};
	});

	function onWindowResize() {
		if (!isShown) return;
		setPopoverPosition();
	}

	function onWindowScroll(e: Event) {
		const target = e.target as HTMLElement;
		if (!target) return;
		if (popoverElement?.contains(target)) return;

		isShown = false;
	}
</script>

<svelte:window onresize={onWindowResize} />

<div class="content" bind:this={contentElement}>
	{@render content()}
</div>

{#if isShown}
	<div
		class="popover"
		style:top={`${popoverTop}px`}
		style:left={`${popoverLeft}px`}
		bind:this={popoverElement}
		transition:fade={{ duration: 75 }}>
		{@render popover()}
	</div>
{/if}

<style lang="less">
	.content {
		position: relative;
	}

	.popover {
		position: fixed;
		inset: unset;
		border: none;
		width: max-content;
		max-width: calc(100vw - 24px);
		max-height: calc(100vh - 24px);
		padding: 0px;
		z-index: 1;
	}
</style>
