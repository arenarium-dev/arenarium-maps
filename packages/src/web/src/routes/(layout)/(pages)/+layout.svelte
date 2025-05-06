<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	import Icon from '$lib/client/components/utils/Icon.svelte';
	import Navigation from '$lib/client/components/Navigation.svelte';

	import { app } from '$lib/client/state/app.svelte';

	let { children } = $props();

	// Initialize
	onMount(() => {
		app.initialize(page);
	});
</script>

<svelte:head>
	<title>Arenarium Maps</title>
	<meta property="og:title" content="@arenarium/maps" />
	<meta property="og:type" content="website" />
	<meta property="og:description" content="Minimalist and performant rendering of popups on a map." />
	<meta property="og:url" content="https://maps.arenarium.dev" />
	<meta property="og:image" content="https://maps.arenarium.dev/favicon.png" />
</svelte:head>

<div class="body">
	<div class="bar">
		<div class="icon">
			<Icon name={'psychiatry'} size={24} />
		</div>
		<a class="title" href="/">@arenarium/maps</a>
		<div class="grow"></div>
		<a class="title" href="/docs">Docs</a>
		<div class="navigation">
			<Navigation />
		</div>
	</div>
	{@render children()}
</div>

<style lang="less">
	@page-width: 1024px;

	.body {
		min-height: 100%;
		display: flex;
		flex-direction: column;

		.bar {
			position: sticky;
			top: 0px;
			left: 0px;
			width: 100%;
			height: 60px;
			display: flex;
			align-items: center;
			gap: 20px;
			padding: 24px;
			background-color: var(--surface);
			box-shadow: 0 3px 4px rgba(0, 0, 0, 0.2);
			z-index: 1;

			.icon {
				display: flex;
				color: #006400;
			}

			.title {
				font-size: 18px;
				font-weight: 600;
				color: var(--on-surface);
			}
		}

		a:hover {
			text-decoration: underline;
		}
	}
</style>
