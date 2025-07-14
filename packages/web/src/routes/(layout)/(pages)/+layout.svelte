<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	import Icon from '$lib/client/components/utils/Icon.svelte';
	import Navigation from '$lib/client/components/core/Navigation.svelte';

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
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href="https://arenarium.dev" />
	<meta
		name="description"
		content="Visualize complex map markers clearly. A JavaScript library for effective display of map markers, compatible with MapLibre, Mapbox, and Google Maps."
	/>
	<!-- Open Graph -->
	<meta property="og:title" content="@arenarium/maps" />
	<meta property="og:type" content="website" />
	<meta
		property="og:description"
		content="Visualize complex map markers clearly. A JavaScript library for effective display of map markers, compatible with MapLibre, Mapbox, and Google Maps."
	/>
	<meta property="og:url" content="https://maps.arenarium.dev" />
	<meta property="og:image" content="https://maps.arenarium.dev/favicon.png" />
	<!-- Twitter Card -->
	<meta name="twitter:title" content="@arenarium/maps" />
	<meta
		name="twitter:description"
		content="Visualize complex map markers clearly. A JavaScript library for effective display of map markers, compatible with MapLibre, Mapbox, and Google Maps."
	/>
	<meta name="twitter:image" content="/favicon.png" />
</svelte:head>

<div class="body">
	<div class="bar">
		<a class="icon" href="/" onclick={goHome}>
			<Icon name={'psychiatry'} size={24} />
		</a>
		<a class="title text" href="/" onclick={goHome}>@arenarium/maps</a>
		<div class="grow"></div>
		<a class="icon" href="https://bsky.app/profile/arenarium.bsky.social" aria-label="Bluesky" target="_blank">
			<svg fill="none" viewBox="0 0 64 57">
				<path
					fill="var(--on-surface)"
					d="M13.873 3.805C21.21 9.332 29.103 20.537 32 26.55v15.882c0-.338-.13.044-.41.867-1.512 4.456-7.418 21.847-20.923 7.944-7.111-7.32-3.819-14.64 9.125-16.85-7.405 1.264-15.73-.825-18.014-9.015C1.12 23.022 0 8.51 0 6.55 0-3.268 8.579-.182 13.873 3.805ZM50.127 3.805C42.79 9.332 34.897 20.537 32 26.55v15.882c0-.338.13.044.41.867 1.512 4.456 7.418 21.847 20.923 7.944 7.111-7.32 3.819-14.64-9.125-16.85 7.405 1.264 15.73-.825 18.014-9.015C62.88 23.022 64 8.51 64 6.55c0-9.818-8.578-6.732-13.873-2.745Z"
				></path>
			</svg>
		</a>
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
			z-index: 1000;

			.icon {
				width: 24px;
				height: 24px;
				display: flex;
				align-items: center;
				justify-content: center;
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
