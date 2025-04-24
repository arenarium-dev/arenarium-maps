<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		click = () => {},
		children
	}: {
		click?: Function;
		children: Snippet;
	} = $props();

	// Elements
	let backgroundElement: HTMLElement;

	// Core
	function onBackgroundClick(e: MouseEvent) {
		// Left button click
		if (e.button == 0 && e.target == backgroundElement) onBackroundAction();
	}

	function onBackgroudKeyUp(e: KeyboardEvent) {
		// Escape key press
		if (e.key == 'Escape') onBackroundAction();
	}

	function onBackroundAction() {
		if (click) click();
	}
</script>

<svelte:window on:keydown={onBackgroudKeyUp} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="background blur-background" role="button" tabindex="0" bind:this={backgroundElement} onclick={onBackgroundClick}>
	<div class="content">
		{@render children()}
	</div>
</div>

<style lang="less">
	.background {
		position: fixed;
		top: 0px;
		left: 0px;
		height: 100%;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2000;
		overflow: auto;

		.content {
			max-height: 100%;
			max-width: 100%;
		}
	}
</style>
