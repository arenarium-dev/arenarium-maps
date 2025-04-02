<script lang="ts">
	import { onMount } from 'svelte';

	import { mountMap } from '@arenarium/maps';
	import '@arenarium/maps/dist/style.css';

	onMount(() => {
		mountMap({
			container: 'map',
			position: {
				center: { lat: 51.505, lng: -0.09 },
				zoom: 13
			},
			theme: 'dark'
		});
	});
</script>

<div id="map"></div>
