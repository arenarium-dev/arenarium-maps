<script lang="ts">
	import { onMount } from 'svelte';

	import { mountMap, type MapPopup } from '@arenarium/maps';
	import '@arenarium/maps/dist/style.css';

	let map: ReturnType<typeof mountMap>;

	onMount(() => {
		map = mountMap({
			container: 'map',
			position: {
				center: { lat: 51.505, lng: -0.09 },
				zoom: 13
			},
			style: {
				name: 'light',
				colors: {
					primary: 'violet',
					background: 'white',
					text: 'black'
				}
			}
		});
	});

	function refresh() {
		map.setPopupsContentCallback(async (ids) => {
			return new Promise((resolve) => {
				resolve(ids.map((id) => `<div style="width:200px; height: 150px; color:violet">${id}</div>`));
			});
		});

		const popups = new Array<MapPopup>();
		const center = { lat: 51.505, lng: -0.09 };
		const radius = 20;
		const count = 1000;

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
	}
</script>

<div id="map"></div>

<div class="bottom-left">
	<button class="button" onclick={refresh}> Refresh </button>
</div>

<style>
	#map {
		position: fixed;
		top: 0px;
		left: 0px;
		width: 100%;
		height: 100%;
		background-color: gray;
	}

	.bottom-left {
		position: fixed;
		bottom: 20px;
		left: 20px;
	}
</style>
