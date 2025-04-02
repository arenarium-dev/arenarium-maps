<script lang="ts">
	import { onMount } from 'svelte';

	import { mountMap } from '$lib/index.js';

	onMount(() => {
		mountMap('map');
	});
</script>

<div id="map"></div>
