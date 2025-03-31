<script lang="ts">
	import { onMount } from 'svelte';

	import { init } from '$lib/index.js';

	onMount(() => {
		init('map');
	});
</script>

<div id="map"></div>
