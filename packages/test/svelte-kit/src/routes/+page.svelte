<script lang="ts">
	import { onMount } from 'svelte';

	import { mountMap, type MapBounds, type MapPopup } from '@arenarium/maps';
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

	async function insert() {
		map.updatePopupContentCallback(getPopupContent);

		const bounds = map.getBounds();
		const popups = await getPopups(bounds);

		const now = performance.now();
		await map.updatePopups(popups);
		console.log(`[SET ${popups.length}] ${performance.now() - now}ms`);
	}

	function remove() {
		map.removePopups();
	}

	async function getPopups(bounds: MapBounds): Promise<MapPopup[]> {
		const popups = new Array<MapPopup>();
		const centers = [
			{ lat: 51.505, lng: -0.09 },
			{ lat: 45, lng: 22 },
			{ lat: 52.52, lng: 13.409 },
			{ lat: 48.8566, lng: 2.3522 }
		];
		const radius = 10;
		const count = 1000;
		const limit = 100;

		let randomPrev = 1;
		const random = () => {
			const val = (randomPrev * 16807) % 2147483647;
			randomPrev = val;
			return val / 2147483647;
		};

		let cnt = 0;
		for (let i = 0; i < count; i++) {
			const index = Math.floor(random() * count);
			const distance = radius / (count - index);
			const center = centers[index % centers.length];

			const lat = center.lat + distance * (-1 + random() * 2);
			const lng = center.lng + distance * (-1 + random() * 2);
			if (lat < bounds.sw.lat || bounds.ne.lat < lat || lng < bounds.sw.lng || bounds.ne.lng < lng) continue;
			if (cnt++ > limit) break;

			popups.push({
				id: i.toString(),
				rank: i,
				lat: lat,
				lng: lng,
				height: 100,
				width: 150
			});
		}

		return await new Promise((resolve) => resolve(popups));
	}

	async function getPopupContent(id: string): Promise<HTMLElement> {
		return await new Promise((resolve) => {
			const element = document.createElement('div');
			element.style.width = '200px';
			element.style.height = '150px';
			element.style.color = 'red';
			element.style.padding = '8px';
			element.innerText = id;
			resolve(element);
		});
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
