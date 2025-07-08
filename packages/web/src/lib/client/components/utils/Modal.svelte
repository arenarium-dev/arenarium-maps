<script lang="ts">
	import { fade } from 'svelte/transition';
	import { page } from '$app/state';
	import { pushState } from '$app/navigation';

	import Background from './Background.svelte';

	import type { Snippet } from 'svelte';

	let {
		onShow = () => {},
		onHide = () => {},
		children
	}: {
		onShow?: Function;
		onHide?: Function;
		children: Snippet;
	} = $props();

	// Export
	export const toggle = () => (modalIsShown ? hideModal() : showModal());
	export const show = () => showModal();
	export const hide = () => hideModal();

	// Core
	let modalId = crypto.randomUUID();
	let modal = $state<Node>();

	let modalPageState = $derived(page.state as any);
	let modalIsShown = $derived(modalPageState?.id == modalId && modalPageState?.showModal);

	function showModal() {
		pushState('', { id: modalId, showModal: true });
		if (onShow) onShow();
	}

	function hideModal() {
		history.back();
		if (onHide) onHide();
	}

	$effect(() => {
		if (modal) {
			document.body.appendChild(modal);
		}
	});
</script>

{#if modalIsShown}
	<div bind:this={modal} transition:fade={{ duration: 75 }}>
		<Background click={hideModal}>
			{@render children()}
		</Background>
	</div>
{/if}
