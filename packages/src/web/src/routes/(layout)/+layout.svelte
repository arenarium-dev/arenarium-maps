<script lang="ts">
	import { onMount } from 'svelte';

	import Icon from '$lib/client/components/utils/Icon.svelte';

	import { app } from '$lib/client/state/app.svelte';

	let { children } = $props();

	// Initialize
	onMount(() => {
		app.initialize();
	});

	function onThemeClick() {
		app.theme.set(app.theme.get() === 'dark' ? 'light' : 'dark');
	}
</script>

<svelte:head>
	<title>Arenarium Maps</title>
	<meta property="og:title" content="Arenarium Maps" />
	<meta property="og:type" content="website" />
	<meta property="og:description" content="Clean popups rendering for maps" />
	<meta property="og:url" content="https://maps.arenarium.dev" />
	<meta property="og:image" content="https://maps.arenarium.dev/favicon.png" />
</svelte:head>

<div class="bar">
	<div class="icon">
		<Icon name={'psychiatry'} size={24} />
	</div>
	<a class="title" href="/">@arenarium/maps</a>
	<div class="grow"></div>
	<button class="theme" onclick={onThemeClick}>
		<Icon name={app.theme.get() === 'dark' ? 'light_mode' : 'dark_mode'} />
	</button>
</div>

<div class="body">
	<div class="page">
		{@render children()}
	</div>
</div>

<style lang="less">
	@page-width: 1024px;

	.bar {
		position: fixed;
		top: 0px;
		left: 0px;
		width: 100%;
		height: 60px;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 24px;
		background-color: var(--surface);
		box-shadow: 0 3px 4px rgba(0, 0, 0, 0.2);
		z-index: 1;

		.icon {
			display: flex;
			color: darkgreen;
		}

		.title {
			font-size: 18px;
			font-weight: 600;
			color: var(--on-surface);
		}

		button {
			width: 36px;
			height: 36px;
			display: flex;
			align-items: center;
			justify-content: center;
			cursor: pointer;

			&:hover {
				background-color: var(--primary-hover);
			}
		}
	}

	.body {
		margin-top: 60px;
		padding-top: 24px;
		padding-bottom: 24px;
		height: 100%;
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		background-color: var(--surface-container);
		overflow: auto;

		.page {
			width: @page-width;
			flex-grow: 1;
			display: flex;
			flex-direction: column;
			padding: 24px;
			border-radius: 8px;
			// border-left: 1px solid var(--surface-container-highest);
			// border-right: 1px solid var(--surface-container-highest);
			background-color: var(--surface);
			box-shadow: 0 0 2px 2px rgba(0, 0, 0, 0.2);
		}
	}

	@media (max-width: @page-width) {
		.body {
			.page {
				width: 100%;
			}
		}
	}
</style>
