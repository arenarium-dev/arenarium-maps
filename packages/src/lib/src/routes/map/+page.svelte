<script lang="ts">
	import { onMount } from 'svelte';

	import Map from '$lib/components/Map.svelte';
	import Icon from '$lib/components/utils/Icon.svelte';

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
		map.setTheme(map.getTheme() === 'dark' ? 'light' : 'dark');
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
