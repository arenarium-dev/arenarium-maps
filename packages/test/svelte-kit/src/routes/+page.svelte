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

	function insert() {
		const center = map.getCenter();
		const popups = new Array<MapPopup>();
		const radius = 20;
		const count = 300;

		for (let i = 0; i < count; i++) {
			const distance = radius / (count - i);
			const lat = center.lat + distance * (-1 + random() * 2);
			const lng = center.lng + distance * (-1 + random() * 2);

			popups.push({
				id: i.toString(),
				lat: lat,
				lng: lng,
				height: 100,
				width: 150,
				index: i
			});
		}

		map.insertPopups(popups, async (id) => {
			return new Promise((resolve) => {
				resolve(`<div style="width:200px; height: 150px; color:violet">${id}</div>`);
			});
		});
	}

	function remove() {
		map.removePopups();
	}

	let randomPrev = 1;
	function random() {
		const val = (randomPrev * 16807) % 2147483647;
		randomPrev = val;
		return val / 2147483647;
	}
</script>

<div id="map"></div>

<div class="bottom-left">
	<button class="button" onclick={insert}> Insert </button>
	<button class="button" onclick={remove}> Remove </button>
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
