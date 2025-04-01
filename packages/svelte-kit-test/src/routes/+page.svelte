<script lang="ts">
	import { onMount } from 'svelte';

	import { mountMap } from '@arenarium/maps';
	import '@arenarium/maps/dist/style.css';

	onMount(() => {
		mountMap('map');
	});
</script>

<div id="map"></div>
