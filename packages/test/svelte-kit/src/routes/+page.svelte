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
			theme: {
				name: 'dark',
				colors: {
					primary: 'violet',
					background: 'black',
					text: 'white'
				}
			}
		});
	});
</script>

<div id="map"></div>

<style>
	#map {
		position: fixed;
		top: 0px;
		left: 0px;
		width: 100%;
		height: 100%;
	}
</style>
