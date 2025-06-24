<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { page } from '$app/state';
	import { invalidate } from '$app/navigation';

	import Icon from '$lib/client/components/utils/Icon.svelte';
	import Modal from '$lib/client/components/utils/Modal.svelte';
	import Toast from '$lib/client/components/Toast.svelte';
	import Form from '$lib/client/components/keys/Form.svelte';

	import { app } from '$lib/client/state/app.svelte';

	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	type APIKey = (typeof data.apiKeys)[number];

	//#region CRUD

	let formModal = $state<ReturnType<typeof Modal>>();
	let formKey = $state<string>('');
	let formName = $state<string>('');
	let formDomains = $state<string[]>([]);

	function createApiKey() {
		formKey = '';
		formName = '';
		formDomains = [];
		formModal?.show();
	}

	function editApiKey(apiKey: APIKey) {
		formKey = apiKey.key;
		formName = apiKey.name;
		formDomains = apiKey.domains;
		formModal?.show();
	}

	async function onFromSuccess() {
		// Show success message
		app.toast.set({
			path: '/keys',
			text: `API key ${formKey ? 'updated' : 'created'}.`,
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
				body: JSON.stringify({ key: apiKey.key })
			});

			// Show success message
			app.toast.set({
				path: '/keys',
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
				path: '/keys',
				text: 'API key copied to clipboard.',
				severity: 'info',
				seconds: 2
			});
		} catch (err) {
			console.error('Failed to copy API key: ', err);
		}
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
			{#each data.apiKeys as apiKey (apiKey.key)}
				<li class="item">
					<div class="info">
						<span class="name">{apiKey.name}</span>
						<span class="usage">{apiKey.usage} requests</span>
						<span class="domains">{apiKey.domains?.join(', ')}</span>
					</div>
					<input
						type="text"
						readonly
						value={apiKey.key}
						class:monospace={true}
						aria-label="API Key Value"
					/>
					<div class="buttons">
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
	<Form success={onFromSuccess} key={formKey} name={formName} domains={formDomains} />
</Modal>

<Toast path={'/keys'} />

<style lang="less">
	.button {
		border-radius: 8px;
		font-weight: 600;
		border: 1px solid var(--on-primary-container);
		background-color: var(--primary-container);
		color: var(--on-primary-container);
		padding: 6px 12px;
		transition: all ease-in-out 125ms;
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

				.usage {
					font-size: 14px;
					color: var(--primary);
					font-weight: 600;
				}

				.domains {
					font-size: 14px;
					opacity: 0.75;
				}
			}

			input[type='text'] {
				height: 38px;
				padding: 8px 12px;
				border: 1px solid var(--outline-variant);
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
					border: 1px solid var(--outline-variant);
					background-color: var(--surface-container-lowest);
					color: var(--on-surface-variant);
					cursor: pointer;

					&:hover {
						box-shadow: 0px 0px 4px 1px rgba(0, 0, 0, 0.2);
					}
				}
			}
		}
	}
</style>
