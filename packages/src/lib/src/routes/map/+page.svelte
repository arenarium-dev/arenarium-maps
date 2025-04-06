<script lang="ts">
	import { onMount } from 'svelte';

	import Icon from './components/Icon.svelte';

	import { mountMap } from '$lib/index.js';
	import type { MapPopup } from '$lib/map/input.js';

	let map: ReturnType<typeof mountMap>;

	onMount(() => {
		map = mountMap({
			container: 'map',
			position: {
				center: { lat: 51.505, lng: -0.09 },
				zoom: 13
			},
			theme: {
				name: 'dark',
				colors: {
					background: 'black',
					primary: 'yellow',
					text: 'white'
				}
			}
		});
	});

	function changeTheme() {
		const theme = map.getTheme();
		if (theme.name === 'dark') {
			map.setTheme({
				name: 'light',
				colors: {
					background: 'white',
					primary: 'blue',
					text: 'black'
				}
			});
		} else {
			map.setTheme({
				name: 'dark',
				colors: {
					background: 'black',
					primary: 'green',
					text: 'white'
				}
			});
		}
	}

	async function changeData() {
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
	}

	function onZoomIn() {
		map.zoomIn();
	}

	function onZoomOut() {
		map.zoomOut();
	}
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" />
	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700;900&display=swap" />
	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded" />
</svelte:head>

<div id="map"></div>

<button class="theme" onclick={changeTheme}>Change theme</button>
<button class="data" onclick={changeData}>Change data</button>

<div class="zooms">
	<button class="button" onmousedown={onZoomIn}>
		<Icon name={'add'} />
	</button>
	<button class="button" onmousedown={onZoomOut}>
		<Icon name={'remove'} />
	</button>
</div>

<style lang="less">
	#map {
		position: fixed;
		top: 0px;
		left: 0px;
		width: 100%;
		height: 100%;
	}

	button {
		padding: 8px 16px;
		border-radius: 8px;
		background-color: white;
		color: black;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
	}

	.theme {
		position: fixed;
		bottom: 20px;
		left: 20px;
	}

	.data {
		position: fixed;
		bottom: 20px;
		left: 160px;
	}

	.zooms {
		position: fixed;
		bottom: 40px;
		right: 12px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;

		.button {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 36px;
			height: 36px;
			border-radius: 18px;
			color: red;
			background-color: green;
			transition: all ease-in-out 125ms;
			outline: none;
			border: none;
			cursor: pointer;
			box-shadow:
				0 0 4px 2px rgb(from var(--shadow) r g b / 0.2),
				0 3px 6px rgb(from var(--shadow) r g b / 0.3);
		}
	}
</style>
