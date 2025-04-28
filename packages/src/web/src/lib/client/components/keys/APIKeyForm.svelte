<script lang="ts">
	import { Fetch } from '$lib/client/core/fetch';
	import { domainsSchema, nameSchema } from '$lib/shared/validation';

	let { success, id, name, domains } = $props<{ success: Function; id: string; name: string; domains: string[] }>();

	let title = $derived(id ? 'Edit API Key' : 'Create API Key');
	let button = $derived(id ? 'Save' : 'Create');

	let nameValue = $state<string>(name);
	let domainsValue = $state<string>(domains.join(','));

	let submitting = $state(false);
	let error = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();

		const name = nameValue.trim();
		const domains = domainsValue
			.split(',')
			.map((d) => d.trim())
			.filter((d) => d);

		if (!nameSchema.safeParse(nameValue).success) {
			error = 'API Key name cannot be empty.';
			return;
		}

		if (!domainsSchema.safeParse(domains).success) {
			error = 'Invalid domains.';
			return;
		}

		submitting = true;
		error = ''; // Clear previous errors

		try {
			// Assume the API call is successful and returns the new key details
			await Fetch.that('/api/keys', {
				method: 'POST',
				body: {
					id: id,
					name: name,
					domains: domains
				}
			});

			// Handle Success
			nameValue = '';
			domainsValue = '';

			success();
		} catch (error: any) {
			console.error('Error posting API key:', error);
			error = error.message || 'An unexpected error occurred. Please try again.';
		} finally {
			submitting = false; // Re-enable the button
		}
	}
</script>

<div class="container shadow-medium">
	<h3>{title}</h3>

	<form onsubmit={handleSubmit} aria-labelledby="header">
		<div class="group">
			<label for="name">Name</label>
			<input
				type="text"
				id="name"
				placeholder="My Web App Key"
				required
				disabled={submitting}
				aria-required="true"
				aria-describedby={error ? 'error-message-desc' : undefined}
				bind:value={nameValue}
			/>
		</div>
		<div class="group">
			<label for="domains">Domains</label>
			<input
				type="text"
				id="domains"
				placeholder="localhost:3000, example.com"
				required
				disabled={submitting}
				aria-required="true"
				aria-describedby={error ? 'error-message-desc' : undefined}
				bind:value={domainsValue}
			/>
		</div>

		{#if error}
			<div class="message error-message" role="alert">
				{error}
			</div>
		{/if}

		<div class="buttons">
			<button type="submit" class="button" disabled={submitting}>
				{#if submitting}
					Loading...
				{:else}
					{button}
				{/if}
			</button>
		</div>
	</form>
</div>

<style lang="less">
	.container {
		width: 512px;
		padding: 32px;
		border-radius: 12px;
		background-color: var(--surface);

		h3 {
			margin-top: 0;
			margin-bottom: 20px;
			color: var(--on-surface);
			font-weight: 600;
		}

		.group {
			margin-bottom: 16px;

			label {
				display: block;
				margin-bottom: 8px;
				font-weight: 500;
				font-size: 14px;
				color: var(--on-surface-variant);
			}

			input[type='text'] {
				width: 100%;
				padding: 8px 12px;
				border: 1px solid var(--outline-variant);
				border-radius: 8px;
				background-color: var(--surface-container-lowest);
				color: var(--on-surface);
				font-size: 14px;
			}

			input[type='text']:disabled {
				cursor: not-allowed;
			}
		}

		.buttons {
			margin-top: 32px;
			text-align: right;
			display: flex;
			justify-content: flex-end;

			.button {
				border: none;
				padding: 10px 18px;
				border-radius: 8px;
				cursor: pointer;
				font-weight: 600;
				border: 1px solid var(--on-primary-container);
				background-color: var(--primary-container);
				color: var(--on-primary-container);
				transition: all ease-in-out 125ms;
			}

			.button:hover {
				box-shadow: 0px 0px 4px 1px rgba(0, 0, 0, 0.2);
			}

			.button:disabled {
				opacity: 0.6;
				cursor: not-allowed;
			}
		}

		/* Message Styling */
		.message {
			padding: 8px 12px;
			margin-bottom: 16px;
			border-radius: 4px;
			font-size: 14px;
			border: 1px solid transparent;
		}

		.error-message {
			color: var(--on-error);
			background-color: var(--error);
			border-color: var(--outline-variant);
		}
	}

	@media (max-width: 546px) {
		.container {
			width: calc(100vw - 48px);
		}
	}
</style>
