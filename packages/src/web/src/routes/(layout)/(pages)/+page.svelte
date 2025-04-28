<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	import Icon from '$lib/client/components/utils/Icon.svelte';
	import Menu from '$lib/client/components/utils/Menu.svelte';
	import Progress from '$lib/client/components/utils/Progress.svelte';

	import { app } from '$lib/client/state/app.svelte';

	import {
		mountMap,
		type MapBounds,
		type MapPopup,
		type MapPopupData,
		type MapPopupState,
		type MapPopupStatesRequest
	} from '@arenarium/maps';
	import '@arenarium/maps/dist/style.css';

	let map = $state<ReturnType<typeof mountMap>>();
	let loading = $state<boolean>(false);

	onMount(() => {
		map = mountMap({
			container: 'map',
			position: {
				center: { lat: 51.505, lng: -0.09 },
				zoom: 4
			},
			style: {
				name: 'light',
				colors: {
					background: 'white',
					primary: 'violet',
					text: 'black'
				}
			}
		});

		map.on('move', (e) => {
			zoom = e.zoom;
		});

		map.on('popup_click', (id) => {
			alert(`Popup ${id} clicked`);
		});

		map.on('loading_start', () => {
			loading = true;
		});

		map.on('loading_end', () => {
			loading = false;
		});
	});

	//#region Style

	let style = $state<string>('Website');

	$effect(() => {
		if (app.ready && app.theme.get() && map) {
			setTimeout(() => {
				if (style == 'Website') {
					setStyleWebsite();
				}
			});
		}
	});

	function onStyleWebsiteClick() {
		setStyleWebsite();
		style = 'Website';
	}

	function onStyleLightClick() {
		setStyleLight();
		style = 'Light';
	}

	function onStyleDarkClick() {
		setStyleDark();
		style = 'Dark';
	}

	function onStyleCustomClick() {
		setStyleCustom();
		style = 'Custom';
	}

	function setStyleWebsite() {
		const theme = app.theme.get();
		if (theme == 'dark') {
			setStyleDark();
		}
		if (theme == 'light') {
			setStyleLight();
		}
	}

	function setStyleLight() {
		map?.setStyle({
			name: 'light',
			colors: {
				background: 'white',
				primary: 'purple',
				text: 'black'
			}
		});
	}

	function setStyleDark() {
		map?.setStyle({
			name: 'dark',
			colors: {
				background: 'lightgray',
				primary: 'violet',
				text: 'black'
			}
		});
	}

	function setStyleCustom() {
		map?.setStyle({
			name: 'light',
			url: 'https://tiles.openfreemap.org/styles/liberty',
			colors: {
				background: 'white',
				primary: 'blue',
				text: 'black'
			}
		});
	}

	//#endregion

	//#region Source

	let source = $state<string>('Rentals');

	async function onSourceSelect(value: string) {
		await clearData();
		await addData();
	}

	async function addData() {
		if (!map) return;

		const bounds = map.getBounds();
		const popups = await getPopups(bounds);

		const now = performance.now();
		await map.updatePopups(popups);
		console.log(`[SET ${popups.length}] ${performance.now() - now}ms`);
	}

	async function clearData() {
		if (!map) return;

		map.removePopups();
	}

	//#region Data

	async function getPopups(bounds: MapBounds): Promise<MapPopup[]> {
		return await new Promise((resolve) => resolve(data));
	}

	async function getPopupStates(request: MapPopupStatesRequest): Promise<MapPopupState[]> {

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

	//#endregion

	//#endregion

	//#region Side

	function onZoomIn() {
		map?.zoomIn();
	}

	function onZoomOut() {
		map?.zoomOut();
	}

	//#endregion
</script>

<div class="container" bind:this={container}>
	<div id="map"></div>

	<div class="top">
		<Menu>
			{#snippet button()}
				<div class="button shadow-small">
					<Icon name={'palette'} size={22} />
					<span>{style}</span>
				</div>
			{/snippet}
			{#snippet menu()}
				<div class="menu shadow-large">
					<button class="item" class:selected={style == 'Website'} onclick={onStyleWebsiteClick}>Website</button>
					<button class="item" class:selected={style == 'Light'} onclick={onStyleLightClick}>Light</button>
					<button class="item" class:selected={style == 'Dark'} onclick={onStyleDarkClick}>Dark</button>
					<button class="item" class:selected={style == 'Custom'} onclick={onStyleCustomClick}>Custom</button>
				</div>
			{/snippet}
		</Menu>
		<Menu>
			{#snippet button()}
				<div class="button shadow-small">
					<Icon name={'database'} size={22} />
					<span>{source}</span>
				</div>
			{/snippet}
			{#snippet menu()}
				<div class="menu shadow-large">
					<button class="item" class:selected={source == 'Rentals'} onclick={() => onSourceSelect('Rentals')}>Rentals</button>
					<button class="item" class:selected={source == 'Events'} onclick={() => onSourceSelect('Events')}>Events</button>
					<button class="item" class:selected={source == 'News'} onclick={() => onSourceSelect('News')}>News</button>
				</div>
			{/snippet}
		</Menu>
	</div>

	<div class="side">
		<button class="button shadow-small" onmousedown={onZoomIn}>
			<Icon name={'add'} size={22} />
		</button>
		<button class="button shadow-small" onmousedown={onZoomOut}>
			<Icon name={'remove'} size={22} />
		</button>
	</div>

	{#if loading}
		<div class="progess" transition:fade={{ duration: 125 }}>
			<Progress />
		</div>
	{/if}
</div>

{#if loading}
	<div class="loading">Loading...</div>
{/if}

<style lang="less">
	.container {
		position: relative;
		flex-grow: 1;

		#map {
			position: absolute;
			top: 0px;
			left: 0px;
			width: 100%;
			height: 100%;
		}

		.button {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 36px;
			height: 36px;
			border-radius: 18px;
			background-color: var(--surface);
			color: var(--on-surface);
			transition: all ease-in-out 125ms;
		}

		.top {
			position: absolute;
			top: 16px;
			left: 16px;
			display: flex;
			gap: 12px;

			.button {
				gap: 8px;
				padding: 8px 16px 8px 8px;
				width: initial;
				font-weight: 600;
				font-size: 13px;
				cursor: pointer;
			}

			.menu {
				margin-top: 12px;
				margin-left: 22px;
				display: flex;
				flex-direction: column;
				align-items: stretch;
				gap: 4px;
				padding: 4px;
				border-radius: 16px;
				background-color: var(--surface);

				.item {
					text-align: start;
					width: 100%;
					padding: 8px 12px;
					width: initial;
					font-weight: 600;
					font-size: 13px;
					border-radius: 12px;
					cursor: pointer;
					transition: all 125ms ease-in-out;

					&.selected {
						background-color: var(--surface-container);
					}

					&:hover {
						background-color: var(--surface-container-high);
					}
				}
			}
		}

		.side {
			position: absolute;
			bottom: 40px;
			right: 12px;
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 12px;
		}

		.progess {
			position: absolute;
			top: 0px;
			left: 0px;
			width: 100%;
			height: 4px;
			overflow: hidden;
		}
	}
</style>
