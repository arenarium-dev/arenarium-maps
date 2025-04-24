<script lang="ts">
	let name = $state('');
	let domains = $state('');

	let submitting = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (!name.trim()) {
			errorMessage = 'API Key name cannot be empty.';
			successMessage = ''; // Clear success message if there was one
			return;
		}

		submitting = true;
		errorMessage = ''; // Clear previous errors
		successMessage = ''; // Clear previous success

		// --- Placeholder for API Call ---
		// In a real application, you would make a fetch request here
		// to your backend endpoint to create the key.
		try {
			// Example: Simulate API call delay
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Assume the API call is successful and returns the new key details
			// const response = await fetch('/api/keys', {
			//     method: 'POST',
			//     headers: { 'Content-Type': 'application/json' },
			//     body: JSON.stringify({ name: keyName /*, permissions: ... */ })
			// });
			// if (!response.ok) {
			//     throw new Error('Failed to create API key');
			// }
			// const newKeyData = await response.json();

			// --- Handle Success ---
			errorMessage = `Successfully created API key: "${name}".`; // In a real app, you might show the actual key here ONCE.
			name = ''; // Reset the form field

			// Optionally: Emit an event to notify the parent component
			// import { createEventDispatcher } from 'svelte';
			// const dispatch = createEventDispatcher();
			// dispatch('keycreated', newKeyData); // Send new key data up
		} catch (error: any) {
			console.error('Error creating API key:', error);
			errorMessage = error.message || 'An unexpected error occurred. Please try again.';
		} finally {
			submitting = false; // Re-enable the button
		}
		// --- End Placeholder ---
	}
</script>

<div class="container shadow-medium">
	<h3>Create API Key</h3>

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
				aria-describedby={errorMessage ? 'error-message-desc' : undefined}
				bind:value={name}
			/>
		</div>
		<div class="group">
			<label for="domains">Domains</label>
			<input
				type="text"
				id="domains"
				placeholder="http://localhost:3000, https://example.com"
				required
				disabled={submitting}
				aria-required="true"
				aria-describedby={errorMessage ? 'error-message-desc' : undefined}
				bind:value={domains}
			/>
		</div>

		{#if successMessage}
			<div class="message success-message" role="alert">
				{successMessage}
			</div>
		{/if}

		{#if errorMessage}
			<div class="message error-message" role="alert">
				{errorMessage}
			</div>
		{/if}

		<div class="buttons">
			<button type="submit" class="button" disabled={submitting}>
				{#if submitting}
					Creating...
				{:else}
					Create Key
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
				border: 1px solid var(--outline-variant);
				cursor: pointer;
				font-weight: 600;
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

		.success-message {
			color: #155724;
			background-color: #d4edda;
			border-color: #c3e6cb;
		}

		.error-message {
			color: #721c24;
			background-color: #f8d7da;
			border-color: #f5c6cb;
		}
	}

	@media (max-width: 546px) {
		.container {
			width: calc(100vw - 48px);
		}
	}
</style>
