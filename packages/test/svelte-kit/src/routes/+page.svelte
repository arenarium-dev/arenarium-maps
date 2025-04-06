<script lang="ts">
	import { onMount } from 'svelte';

	import { mountMap } from '@arenarium/maps';
	import '@arenarium/maps/dist/style.css';

	onMount(() => {
		let map = mountMap({
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

		map.setPopupsContentCallback(async (ids) => {
			return new Promise((resolve) => {
				resolve(ids.map((id) => `<div style="width:200px; height: 150px; background-color:red">${id}</div>`));
			});
		});

		const popups = new Array<MapPopup>();
		const center = { lat: 51.505, lng: -0.09 };
		const radius = 20;
		const count = 300;

		for (let i = 0; i < count; i++) {
			const distance = radius / (count - i);
			const lat = center.lat + distance * (-1 + Math.random() * 2);
			const lng = center.lng + distance * (-1 + Math.random() * 2);

			popups.push({
				id: i.toString(),
				lat: lat,
				lng: lng,
				height: 100,
				width: 150,
				index: i
			});
		}

		map.setPopups(popups);
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
