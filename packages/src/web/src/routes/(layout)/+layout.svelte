<script lang="ts">
	import { onMount } from 'svelte';

	import { app } from '$lib/client/state/app.svelte';

	let { children } = $props();

	// Initialize
	onMount(() => {
		app.initialize();
	});
</script>

<svelte:head>
	<title>Arenarium Maps</title>
	<meta property="og:title" content="Arenarium Maps" />
	<meta property="og:type" content="website" />
	<meta property="og:description" content="Clean popups rendering for maps" />
	<meta property="og:url" content="https://maps.arenarium.dev" />
	<meta property="og:image" content="https://maps.arenarium.dev/favicon.png" />
</svelte:head>

{@render children()}