<script lang="ts">
	import { onMount } from 'svelte';

	onMount(() => {
		arenarium.mountMap('map');
	});
</script>

<svelte:head>
	<script src="/build.umd.js"></script>
	<link rel="stylesheet" href="/style.css" />
</svelte:head>

<div id="map"></div>
