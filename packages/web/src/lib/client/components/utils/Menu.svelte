<script lang="ts">
	import Popover from './Popover.svelte';

	import { type Snippet } from 'svelte';

	// Props
	let {
		axis = 'y',
		onShow,
		onHide,
		button,
		menu
	}: {
		axis?: 'x' | 'y';
		onShow?: Function;
		onHide?: Function;
		button: Snippet;
		menu: Snippet;
	} = $props();

	export const show = () => {
		isShown = true;
		popoverComponent?.show();
	};

	export const hide = () => {
		isShown = false;
		popoverComponent?.hide();
	};

	// Bindings
	let buttonElement = $state<HTMLElement>();
	let popoverComponent = $state<ReturnType<typeof Popover>>();

	let isShown = $state<boolean>(false);

	function onClick() {
		if (!popoverComponent) return;

		if (isShown) {
			if (popoverComponent.visible() == true) {
				popoverComponent.hide();
			}
		} else {
			if (popoverComponent.visible() == false) {
				popoverComponent.show();
			}
		}

		isShown = !isShown;
	}

	function onPopoverShow() {
		isShown = true;
		onShow?.();
	}

	function onPopoverHide() {
		isShown = false;
		onHide?.();
	}

	// Window
	function onWindowClick(e: MouseEvent) {
		if (buttonElement?.contains(e.target as Node)) return;
		hide();
	}

	function onWindowKeyUp(e: KeyboardEvent) {
		if (e.key !== 'Escape') return;
		hide();
	}
</script>

<svelte:window onclick={onWindowClick} onkeyup={onWindowKeyUp} />

{#snippet content()}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="button" bind:this={buttonElement} onclick={onClick}>
		{@render button()}
	</div>
{/snippet}

{#snippet popover()}
	{@render menu()}
{/snippet}

<Popover bind:this={popoverComponent} {axis} {content} {popover} onShow={onPopoverShow} onHide={onPopoverHide}></Popover>

<style lang="less">
	.button,
	.button:hover,
	.button:active,
	.button:focus {
		-moz-user-select: none;
		-webkit-user-select: none;
		user-select: none;
	}
</style>
