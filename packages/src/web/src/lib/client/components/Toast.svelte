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
		if (toast) {
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
		<button class="text button" onclick={onButtonClick}>{buttonText}</button>
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
		gap: 12px;
		padding: 12px 18px;
		z-index: 3000;
		cursor: pointer;

		.text {
			font-size: 14px;
			line-height: 18px;
			font-weight: bold;
		}
	}

	.toast.info {
		background: var(--surface);

		.text {
			color: var(--on-surface);
		}

		.button {
			color: var(--primary-container);
		}
	}

	.toast.error {
		background: var(--error-container);

		.text {
			color: var(--error);
		}

		.button {
			color: var(--on-error-container);
		}
	}
</style>
