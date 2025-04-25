<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { page } from '$app/state';
	import { invalidate } from '$app/navigation';

	import Icon from '$lib/client/components/utils/Icon.svelte';
	import Modal from '$lib/client/components/utils/Modal.svelte';
	import APIKeyForm from '$lib/client/components/profile/APIKeyForm.svelte';

	import { app } from '$lib/client/state/app.svelte';

	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	type APIKey = (typeof data.apiKeys)[number];

	//#region CRUD

	let formModal = $state<ReturnType<typeof Modal>>();
	let formId = $state<string>('');
	let formName = $state<string>('');
	let formDomains = $state<string[]>([]);

	function createApiKey() {
		formId = '';
		formName = '';
		formDomains = [];
		formModal?.show();
	}

	function editApiKey(apiKey: APIKey) {
		formId = apiKey.id;
		formName = apiKey.name;
		formDomains = apiKey.domains;
		formModal?.show();
	}

	async function onFromSuccess() {
		// Show success message
		app.toast.set({
			text: `API key ${formId ? 'updated' : 'created'}.`,
			severity: 'info',
			seconds: 2
		});

		// Hide the modal
		formModal?.hide();

		// Doesnt work without this
		await new Promise((resolve) => setTimeout(resolve, 1));

		// Invalidate the data
		invalidate('data:profile');
	}

	async function deleteApiKey(apiKey: APIKey) {
		try {
			// Clear the toast
			app.toast.set(null);

			// Delete the key
			await fetch(`/api/key`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: apiKey.id })
			});

			// Show success message
			app.toast.set({
				text: 'API key "' + apiKey.name + '" deleted.',
				severity: 'info'
			});

			// Invalidate the data
			invalidate('data:profile');
		} catch (err) {
			console.error('Failed to delete API key: ', err);
		}
	}

	//#endregion

	//#region Clipboard

	async function copyApiKey(apiKey: APIKey) {
		try {
			await navigator.clipboard.writeText(apiKey.key);
			app.toast.set({
				text: 'API key copied to clipboard.',
				severity: 'info',
				seconds: 2
			});
		} catch (err) {
			console.error('Failed to copy API key: ', err);
		}
	}

	//#endregion

	//#region Visibility

	let visibleKeys = new SvelteMap();

	onMount(() => {
		data.apiKeys.forEach((key) => {
			if (!visibleKeys.has(key.id)) {
				visibleKeys.set(key.id, false); // Start hidden
			}
		});
	});

	function toggleApiKeyVisibility(keyId: string) {
		visibleKeys.set(keyId, !visibleKeys.get(keyId));
	}

	function maskApiKey(key: string) {
		if (!key || key.length < 8) {
			// Return fixed mask for very short keys
			return '••••••••';
		}

		// Show first 4 and last 4 characters e.g., sk_l...CDEF
		const prefixMatch = key.match(/^(sk_|pk_)(live|test)_/);
		const prefix = prefixMatch ? prefixMatch[0] : '';
		const keyPart = prefix ? key.substring(prefix.length) : key;

		if (keyPart.length < 8) return prefix + '••••••••';

		return `${prefix}${keyPart.substring(0, 4)}••••••••${keyPart.substring(keyPart.length - 4)}`;
	}

	//#endregion
</script>

<div class="header">
	<div class="text">API Keys</div>
	<button class="button create" onclick={createApiKey}>
		<Icon name={'add'} />
		Create
	</button>
</div>

{#if data.apiKeys.length === 0}
	<p class="empty">You currently have no API keys.</p>
{:else}
	<ul class="keys">
		{#key page.data}
			{#each data.apiKeys as apiKey (apiKey.id)}
				<li class="item">
					<div class="info">
						<span class="name">{apiKey.name}</span>
						<span class="domains">{apiKey.domains.join(', ')}</span>
					</div>
					<input
						type="text"
						readonly
						value={visibleKeys.get(apiKey.id) ? apiKey.key : maskApiKey(apiKey.key)}
						class:monospace={visibleKeys.get(apiKey.id)}
						aria-label="API Key Value"
					/>
					<div class="buttons">
						<button
							class="button"
							onclick={() => toggleApiKeyVisibility(apiKey.id)}
							title={visibleKeys.get(apiKey.id) ? 'Hide key' : 'Show key'}
							aria-label={visibleKeys.get(apiKey.id) ? 'Hide API key' : 'Show API key'}
						>
							{#if visibleKeys.get(apiKey.id)}
								<Icon name={'visibility'} />
							{:else}
								<Icon name={'visibility_off'} />
							{/if}
						</button>
						<button class="button copy" title="Copy key" aria-label="Copy API key" onclick={() => copyApiKey(apiKey)}>
							<Icon name={'content_copy'} />
						</button>
						<button class="button edit" title="Edit key" aria-label="Edit API key" onclick={() => editApiKey(apiKey)}>
							<Icon name={'edit'} />
						</button>
						<button class="button delete" title="Delete key" aria-label="Delete API key" onclick={() => deleteApiKey(apiKey)}>
							<Icon name={'delete'} />
						</button>
					</div>
				</li>
			{/each}
		{/key}
	</ul>
{/if}

<Modal bind:this={formModal}>
	<APIKeyForm success={onFromSuccess} id={formId} name={formName} domains={formDomains} />
</Modal>

<style lang="less">
	.button {
		border-radius: 8px;
		border: 1px solid var(--outline-variant);
		font-weight: 600;
		background-color: var(--primary-container);
		color: var(--on-primary-container);
		padding: 6px 12px;
		transition: all ease-in-out 125ms;

		&:hover {
			box-shadow: 0px 0px 4px 1px rgba(0, 0, 0, 0.2);
		}
	}

	.header {
		display: flex;
		gap: 8px;
		align-items: center;

		.text {
			flex-grow: 1;
			font-size: 24px;
			font-weight: 600;
		}

		.create {
			display: flex;
			gap: 8px;
			align-items: center;
			border-radius: 8px;
		}
	}

	.empty {
		margin: 24px 0px;
		padding: 16px;
		text-align: center;
		color: var(--on-surface-variant);
		border-top: 1px solid var(--surface-container);
		border-bottom: 1px solid var(--surface-container);
		font-size: 14px;
	}

	.keys {
		list-style: none;
		padding: 24px 0px;
		margin: 0;

		.item {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: 8px;
			padding: 16px 0px;
			border-bottom: 1px solid var(--surface-container);

			&:first-child {
				border-top: 1px solid var(--surface-container);
			}

			.info {
				display: flex;
				flex-direction: column;
				flex-grow: 1;
				margin-right: 16px;
				margin-bottom: 8px;
				color: var(--on-surface);

				.name {
					font-weight: 600;
					margin-bottom: 4px;
				}

				.domains {
					font-size: 14px;
					opacity: 0.75;
				}
			}

			input[type='text'] {
				height: 38px;
				padding: 8px 12px;
				border: 1px solid #ccc;
				border-radius: 8px;
				background-color: var(--surface-container-lowest);
				font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
				font-size: 14px;
				min-width: 272px;
				color: var(--on-surface);
			}

			input[type='text'].monospace {
				color: #333;
			}

			.buttons {
				display: flex;
				gap: 8px;
				align-items: center;

				.button {
					width: 38px;
					height: 38px;
					display: flex;
					align-items: center;
					justify-content: center;
					padding: 0px;
					cursor: pointer;
				}
			}
		}
	}
</style>
