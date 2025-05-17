<script lang="ts">
	import { fly } from 'svelte/transition';

	import { app } from '$lib/client/state/app.svelte';

	import type { ToastData } from '$lib/client/state/toast.svelte';

	// Core
	let isShown = $state<boolean>(false);
	let text = $state<string>();
	let severity = $state<string>();
	let buttonText = $state<string>();
	let buttonFuction = $state<Function>();

	let toast = $derived(app.toast.get());

	$effect(() => {
		let toast = app.toast.get();
		let toastValid = app.toast.valid();
		if (toast && toastValid) {
			showToast(toast);
		} else {
			hideToast();
		}
	});

	function showToast(data: ToastData) {
		isShown = true;
		text = data.text;
		severity = data.severity ?? 'info';

		buttonText = data.callback?.name ?? 'OK';
		buttonFuction = data.callback?.function;

		if (data.seconds) {
			setTimeout(() => {
				hideToast();
			}, data.seconds * 1000);
		}
	}

	function hideToast() {
		isShown = false;
		text = undefined;
		severity = undefined;
		buttonText = undefined;
		buttonFuction = undefined;
	}

	function onButtonClick() {
		if (buttonFuction) buttonFuction();
		hideToast();
	}
</script>

{#if isShown}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="toast shadow-small {severity}" onclick={hideToast} transition:fly={{ duration: 125, y: 16 }}>
		<div class="text">{text}</div>
		{#if buttonFuction}
			<button class="text button" onclick={onButtonClick}>{buttonText}</button>
		{/if}
	</div>
{/if}

<style lang="less">
	.toast {
		position: fixed;
		width: max-content;
		max-width: calc(100% - 64px);
		bottom: 16px;
		left: 50%;
		transform: translateX(-50%);
		border-radius: 16px;
		display: flex;
		flex-direction: row;
		z-index: 3000;
		overflow: hidden;
		cursor: pointer;

		.text {
			padding: 12px 18px;
			font-size: 13px;
			line-height: 18px;
			font-weight: 600;
		}

		.button {
			border-left: 1px solid var(--outline-variant);
			transition: all 125ms ease-in-out;

			&:hover {
				filter: brightness(0.9);
			}
		}
	}

	.toast.info {
		background: var(--surface);

		.text {
			color: var(--on-surface);
		}

		.button {
			background-color: var(--primary-container);
			color: var(--on-primary-container);
		}
	}

	.toast.error {
		background: var(--error-container);

		.text {
			color: var(--error);
		}

		.button {
			background-color: var(--error);
			color: var(--on-error);
		}
	}
</style>
