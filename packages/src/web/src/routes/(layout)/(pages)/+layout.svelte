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

	async function goHome() {
		window.location.href = '/';
	}
</script>

<svelte:head>
	<title>@arenarium/maps</title>
	<meta property="og:title" content="@arenarium/maps" />
	<meta property="og:type" content="website" />
	<meta property="og:description" content="Minimalist and performant rendering of popups on a map." />
	<meta property="og:url" content="https://maps.arenarium.dev" />
	<meta property="og:image" content="https://maps.arenarium.dev/favicon.png" />
</svelte:head>

<div class="body">
	<div class="bar">
		<a class="icon" href="/" onclick={goHome}>
			<Icon name={'psychiatry'} size={24} />
		</a>
		<a class="title text" href="/" onclick={goHome}>@arenarium/maps</a>
		<div class="grow"></div>
		<a class="text" href="/pricing">Pricing</a>
		<a class="text" href="/docs">Docs</a>
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

			.text {
				font-size: 16px;
				font-weight: 600;
				color: var(--on-surface);
			}
		}

		a:hover {
			text-decoration: underline;
		}
	}

	@media (max-width: 512px) {
		.body {
			.bar {
				.title {
					display: none;
				}

				.text {
					font-size: 14px;
				}
			}
		}
	}
</style>
