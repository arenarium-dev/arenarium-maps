<script lang="ts">
	import { onMount } from 'svelte';

	import Map from '$lib/components/Map.svelte';

	import { mountMap } from '$lib/index.js';

	let map: ReturnType<typeof Map>;

	onMount(() => {
		map = mountMap({
			container: 'map',
			position: {
				center: { lat: 51.505, lng: -0.09 },
				zoom: 13
			},
			theme: 'dark'
		});
	});

	function changeTheme() {
		map.setMapTheme(map.getMapTheme() === 'dark' ? 'light' : 'dark');
	}
</script>

<div id="map"></div>

<button class="theme" onclick={changeTheme}>Change theme</button>

<style>
	#map {
		position: fixed;
		top: 0px;
		left: 0px;
		width: 100%;
		height: 100%;
	}

	.theme {
		position: fixed;
		bottom: 20px;
		left: 20px;
		padding: 8px 16px;
		border-radius: 8px;
		background-color: white;
		color: black;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
	}
</style>
