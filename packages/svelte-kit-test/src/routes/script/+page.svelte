<script lang="ts">
	import { onMount } from 'svelte';

	onMount(() => {
		new Arenarium();
	});
</script>

<svelte:head>
	<script src="/build.min.js"></script>
	<link rel="stylesheet" href="/style.css" />
</svelte:head>

<div id="app"></div>
