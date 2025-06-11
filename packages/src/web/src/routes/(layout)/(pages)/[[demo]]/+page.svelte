<script lang="ts">
	import { mount, onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { page } from '$app/state';

	import Icon from '$lib/client/components/utils/Icon.svelte';
	import Menu from '$lib/client/components/utils/Menu.svelte';
	import Progress from '$lib/client/components/utils/Progress.svelte';
	import Toast from '$lib/client/components/Toast.svelte';

	import BasicPopup from '$lib/client/components/demo/basic/Popup.svelte';
	import RentalPopup from '$lib/client/components/demo/rentals/Popup.svelte';
	import RentalPin from '$lib/client/components/demo/rentals/Pin.svelte';
	import SrbijaNekretninePopup from '$lib/client/components/demo/srbija-nekretnine/Popup.svelte';
	import CityExpertPopup from '$lib/client/components/demo/cityexpert/Popup.svelte';
	import CityExpertPin from '$lib/client/components/demo/cityexpert/Pin.svelte';

	import { app } from '$lib/client/state/app.svelte';
	import { Fetch } from '$lib/client/core/fetch';
	import { Demo } from '$lib/shared/demo';

	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';

	import * as arenarium from '@arenarium/maps';
	import '@arenarium/maps/dist/style.css';

	let map: maplibregl.Map;
	let mapManager: arenarium.MapManager;

	let mapLoaded = $state<boolean>(false);
	let loading = $state<boolean>(false);

	onMount(() => {
		try {
			mapManager = new arenarium.MapManager(maplibregl.Map, maplibregl.Marker, {
				container: 'map'
			});
			mapManager.setColors('darkgreen', 'white', 'black');

			map = mapManager.maplibre;
			map.setStyle(app.theme.get() == 'dark' ? arenarium.MapDarkStyle : arenarium.MapStyleLight);
			map.on('load', () => {
				mapLoaded = true;
			});
		} catch (e) {
			console.error(e);

			app.toast.set({
				path: '/',
				text: 'Failed to initialize map.',
				severity: 'error'
			});
		} finally {
			app.toast.set(null);
		}
	});

	//#region Tune

	let palleteMenuComponent = $state<ReturnType<typeof Menu>>();
	let demoMenuComponent = $state<ReturnType<typeof Menu>>();

	function onPalleteClick(e: Event) {
		e.stopPropagation();
		palleteMenuComponent?.show();
		demoMenuComponent?.hide();
	}

	function onDemoClick(e: Event) {
		e.stopPropagation();
		palleteMenuComponent?.hide();
		demoMenuComponent?.show();
	}

	//#endregion

	//#region Demo

	type DemoSize = 'small' | 'large';
	type DemoStyle = 'website' | 'light' | 'dark' | 'liberty';

	let size: DemoSize = 'large';
	let style = $state<DemoStyle>('website');
	let demo = $state<Demo>(page.params.demo as Demo);

	let demoPopupData = new Map<string, arenarium.MapPopupData>();
	let demoPopupDataLoaded = false;
	let demoAutoUpdate = $state<boolean>(false);
	let demoTogglePopups = $state<boolean>(true);

	$effect(() => {
		if (mapLoaded) {
			size = window.innerWidth < 640 ? 'small' : 'large';

			setTimeout(async () => {
				await onMapLoad();
				await onMapIdle();

				map.on('idle', async () => {
					await onMapIdle();
				});
			});
		}
	});

	$effect(() => {
		if (mapLoaded) {
			// Update style
			map.setStyle(getDemoStyle(demo, style));

			// Update colors
			const demoColors = getDemoColors(demo, style);
			mapManager.setColors(demoColors.primary, demoColors.background, demoColors.text);
		}
	});

	$effect(() => {
		if (mapLoaded && demo != page.params.demo) {
			demo = page.params.demo as Demo;

			setTimeout(async () => {
				await onMapLoad();
				await onMapIdle();
			});
		}
	});

	async function onMapLoad() {
		// Update position
		const demoRestriction = getDemoPosition(demo);
		map.setMinZoom(demoRestriction.zoom);
		map.setCenter([demoRestriction.lng, demoRestriction.lat]);

		// Update configuration
		mapManager.setConfiguration(getDemoConfiguration(demo));

		// Update data
		demoPopupData.clear();
		demoPopupDataLoaded = false;

		mapManager.removePopups();
	}

	async function onMapIdle() {
		const bounds = map.getBounds();
		processBoundsChange(bounds);
	}

	function onDemoAutoUpdateClick(e: Event) {
		e.stopPropagation();
		demoAutoUpdate = !demoAutoUpdate;
	}

	function onDemoTogglePopupsClick(e: Event) {
		e.stopPropagation();

		demoTogglePopups = !demoTogglePopups;
		mapManager.togglePopups(Array.from(demoPopupData.values()).map((p) => ({ id: p.id, toggled: demoTogglePopups })));
	}

	async function processBoundsChange(bounds: maplibregl.LngLatBounds) {
		if (demoPopupDataLoaded) return;

		try {
			loading = true;

			app.toast.set(null);

			switch (demo) {
				case Demo.CityExpert: {
					demoPopupDataLoaded = true;
					break;
				}
			}

			const { width, height, padding } = getPopupDimensions();

			const params = new URLSearchParams();
			params.append('total', '128');
			params.append('width', width.toString());
			params.append('height', height.toString());
			params.append('padding', padding.toString());
			params.append('swlat', bounds.getSouthWest().lat.toString());
			params.append('swlng', bounds.getSouthWest().lng.toString());
			params.append('nelat', bounds.getNorthEast().lat.toString());
			params.append('nelng', bounds.getNorthEast().lng.toString());

			const allPopupData = await Fetch.that<arenarium.MapPopupData[]>(`/api/popup/${demo}/data?${params}`);
			const newPopupData = new Array<arenarium.MapPopupData>();
			for (const data of allPopupData) {
				if (!demoPopupData.has(data.id)) {
					newPopupData.push(data);
				}
			}

			if (newPopupData.length === 0) return;

			if (demoAutoUpdate || demoPopupData.size === 0) {
				await processPopupDataDelta(newPopupData);
				return;
			}

			app.toast.set({
				path: '/',
				text: `Load ${newPopupData.length} new popups?`,
				severity: 'info',
				callback: {
					name: 'Yes',
					function: async () => {
						await processPopupDataDelta(newPopupData);
					}
				}
			});
		} catch (err) {
			console.error(err);
			app.toast.set({
				path: '/',
				text: 'Failed to process popups.',
				severity: 'error',
				seconds: 2
			});
		} finally {
			loading = false;
		}
	}

	async function processPopupDataDelta(dataDelta: arenarium.MapPopupData[]) {
		try {
			loading = true;

			// Update the loaded data
			dataDelta.forEach((d) => demoPopupData.set(d.id, d));

			// Get the new states
			const statePopupData = Array.from(demoPopupData.values());
			const states = await Fetch.that<arenarium.MapPopupState[]>(`/api/popup/states`, {
				method: 'POST',
				body: statePopupData
			});

			// Create the new popups
			const popups = new Array<arenarium.MapPopup>();
			for (let i = 0; i < states.length; i++) {
				const popup: arenarium.MapPopup = {
					data: statePopupData[i],
					state: states[i],
					callbacks: {
						body: getPopupBody,
						pin: getPopupPin
					}
				};
				popups.push(popup);
			}

			// Update the popups
			await mapManager.updatePopups(popups);
			mapManager.togglePopups(popups.map((p) => ({ id: p.data.id, toggled: demoTogglePopups })));
		} catch (err) {
			console.error(err);
			app.toast.set({
				path: '/',
				text: 'Failed to get popup state.',
				severity: 'error',
				seconds: 2
			});
		} finally {
			loading = false;
		}
	}

	function getDemoName(demo: Demo) {
		switch (demo) {
			default:
				return 'Basic';
			case Demo.Rentals:
				return 'Rentals';
			case Demo.Events:
				return 'Events';
			case Demo.News:
				return 'News';
			case Demo.SrbijaNekretnine:
				return 'srbija-nekretnine.org';
			case Demo.CityExpert:
				return 'cityexpert.rs';
		}
	}

	function getDemoStyle(demo: Demo, style: DemoStyle): string | maplibregl.StyleSpecification {
		switch (demo) {
			case Demo.SrbijaNekretnine: {
				return 'https://tiles.openfreemap.org/styles/bright';
			}
			case Demo.CityExpert: {
				return 'demo/cityexpert.style.json';
			}
			default: {
				switch (style) {
					case 'website': {
						return app.theme.get() == 'dark' ? arenarium.MapDarkStyle : arenarium.MapStyleLight;
					}
					case 'light': {
						return arenarium.MapStyleLight;
					}
					case 'dark': {
						return arenarium.MapDarkStyle;
					}
					case 'liberty': {
						return 'https://tiles.openfreemap.org/styles/liberty';
					}
				}
			}
		}
	}

	function getDemoColors(demo: Demo, style: DemoStyle): { background: string; primary: string; text: string } {
		switch (demo) {
			case Demo.SrbijaNekretnine: {
				return {
					background: 'white',
					primary: '#ff4400',
					text: 'black'
				};
			}
			case Demo.CityExpert: {
				return {
					background: 'white',
					primary: 'white',
					text: 'black'
				};
			}
			default: {
				switch (style) {
					case 'website': {
						return app.theme.get() == 'dark'
							? { background: 'var(--surface)', primary: 'lightgreen', text: 'var(--on-surface)' }
							: { background: 'white', primary: 'darkgreen', text: 'black' };
					}
					case 'light': {
						return { background: 'white', primary: 'darkgreen', text: 'black' };
					}
					case 'dark': {
						return { background: 'var(--surface)', primary: 'lightgreen', text: 'var(--on-surface)' };
					}
					case 'liberty': {
						return { background: 'white', primary: 'blue', text: 'black' };
					}
				}
			}
		}
	}

	function getDemoPosition(demo: Demo): { lat: number; lng: number; zoom: number } {
		switch (demo) {
			case Demo.SrbijaNekretnine: {
				return {
					lat: 44.811222,
					lng: 20.450989,
					zoom: 12
				};
			}
			case Demo.CityExpert: {
				return {
					lat: 44.811222,
					lng: 20.450989,
					zoom: 10
				};
			}
			default: {
				return {
					lat: 51.505,
					lng: -0.09,
					zoom: 4
				};
			}
		}
	}

	function getDemoConfiguration(demo: Demo): arenarium.MapConfiguration {
		switch (demo) {
			default: {
				return {
					pin: {
						fade: true
					}
				};
			}
			case Demo.CityExpert: {
				return {
					pin: {
						fade: false
					}
				};
			}
		}
	}

	function getPopupDimensions(): { width: number; height: number; padding: number } {
		switch (demo) {
			default:
				switch (size) {
					case 'large':
						return { width: 64, height: 64, padding: 6 };
					case 'small':
						return { width: 48, height: 48, padding: 4 };
				}
			case Demo.Rentals:
				switch (size) {
					case 'large':
						return { width: 128, height: 104, padding: 8 };
					case 'small':
						return { width: 96, height: 80, padding: 6 };
				}
			case Demo.SrbijaNekretnine:
				return { width: 156, height: 128, padding: 8 };
			case Demo.CityExpert:
				return { width: 156, height: 128, padding: 8 };
		}
	}

	async function getPopupBody(id: string): Promise<HTMLElement> {
		return await new Promise((resolve) => {
			const popup = demoPopupData.get(id);
			if (!popup) throw new Error('Popup not found');

			const element = document.createElement('div');
			element.addEventListener('click', () => onPopupClick(id));

			switch (demo) {
				default:
					mount(BasicPopup, { target: element, props: { id, width: popup.width, height: popup.height } });
					break;
				case Demo.Rentals:
					mount(RentalPopup, { target: element, props: { id, width: popup.width, height: popup.height } });
					break;
				case Demo.SrbijaNekretnine:
					mount(SrbijaNekretninePopup, { target: element, props: { id, width: popup.width, height: popup.height } });
					break;
				case Demo.CityExpert:
					mount(CityExpertPopup, { target: element, props: { id, width: popup.width, height: popup.height } });
					break;
			}
			resolve(element);
		});
	}

	async function getPopupPin(id: string): Promise<HTMLElement> {
		return await new Promise((resolve) => {
			const popup = demoPopupData.get(id) as any;
			if (!popup) throw new Error('Popup not found');

			const element = document.createElement('div');
			element.addEventListener('click', () => onPinClick(id));

			switch (demo) {
				case Demo.Rentals:
					mount(RentalPin, { target: element, props: { id } });
					break;
				case Demo.CityExpert:
					mount(CityExpertPin, { target: element, props: { id, type: popup.type } });
					break;
			}
			resolve(element);
		});
	}

	function onPopupClick(id: string) {
		switch (demo) {
			case Demo.Rentals:
				// map.togglePopups([{ id: id, toggled: false }]);
				break;
		}
	}

	function onPinClick(id: string) {
		switch (demo) {
			case Demo.Rentals:
				// map.togglePopups([{ id: id, toggled: true }]);
				break;
		}
	}

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

<div class="container">
	<div id="map">
		{#if mapLoaded}
			<div class="top">
				<Menu>
					{#snippet button()}
						<div class="button shadow-small">
							<Icon name={'tune'} size={22} />
							<span>{getDemoName(demo)}</span>
						</div>
					{/snippet}
					{#snippet menu()}
						<div class="menu shadow-large">
							<Menu axis={'x'} bind:this={palleteMenuComponent}>
								{#snippet button()}
									<button class="item" onclick={onPalleteClick}>
										<Icon name={'palette'} size={22} />
										<span>Style</span>
										<Icon name={'arrow_right'} />
									</button>
								{/snippet}
								{#snippet menu()}
									<div class="menu pallete shadow-large">
										<button class="item" class:selected={style == 'website'} onclick={() => (style = 'website')}>Website</button>
										<button class="item" class:selected={style == 'light'} onclick={() => (style = 'light')}>Light</button>
										<button class="item" class:selected={style == 'dark'} onclick={() => (style = 'dark')}>Dark</button>
										<button class="item" class:selected={style == 'liberty'} onclick={() => (style = 'liberty')}>Liberty</button>
									</div>
								{/snippet}
							</Menu>
							<Menu axis={'x'} bind:this={demoMenuComponent}>
								{#snippet button()}
									<button class="item" onclick={onDemoClick}>
										<Icon name={'database'} size={22} />
										<span>Data</span>
										<Icon name={'arrow_right'} />
									</button>
								{/snippet}
								{#snippet menu()}
									<div class="menu demo shadow-large">
										<a href="/" class="item" class:selected={page.params.demo == undefined}> Basic </a>
										<a href="/{Demo.Rentals}" class="item" class:selected={page.params.demo == Demo.Rentals}>{getDemoName(Demo.Rentals)}</a>
										<a href="/{Demo.News}" class="item" inert>{getDemoName(Demo.News)}</a>
										<a href="/{Demo.Events}" class="item" inert>{getDemoName(Demo.Events)}</a>
									</div>
								{/snippet}
							</Menu>
							<button class="item" onclick={onDemoAutoUpdateClick}>
								<Icon name={demoAutoUpdate ? 'check_box' : 'check_box_outline_blank'} size={22} />
								<span>Auto Load</span>
							</button>
							<button class="item" onclick={onDemoTogglePopupsClick}>
								<Icon name={demoTogglePopups ? 'check_box' : 'check_box_outline_blank'} size={22} />
								<span>Show Popups</span>
							</button>
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
				<div class="progess" transition:fade={{ duration: 125, delay: 50 }}>
					<Progress />
				</div>
			{/if}
		{/if}
	</div>
</div>

<Toast path="/" />

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
			font-family: 'Noto Sans';
		}

		.button {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 36px;
			height: 36px;
			border-radius: 18px;
			background-color: var(--map-style-background);
			color: var(--map-style-text);
			transition: all ease-in-out 125ms;
		}

		.top {
			position: absolute;
			top: 16px;
			left: 16px;
			display: flex;
			flex-direction: column;
			align-items: start;
			gap: 12px;
			z-index: 10000000;

			.button {
				width: auto;
				display: flex;
				flex-direction: row;
				align-items: center;
				gap: 8px;
				padding: 8px 12px 8px 10px;
				font-weight: 600;
				font-size: 14px;
				cursor: pointer;
			}

			.menu {
				margin-top: 12px;
				display: flex;
				flex-direction: column;
				align-items: stretch;
				padding: 4px;
				border-radius: 16px;
				background-color: var(--map-style-background);

				.item {
					width: 100%;
					display: flex;
					align-items: center;
					gap: 8px;
					padding: 8px;
					font-weight: 600;
					font-size: 13px;
					border-radius: 12px;
					color: var(--map-style-text);
					cursor: pointer;
					transition: all 125ms ease-in-out;

					span {
						flex-grow: 1;
						text-align: start;
					}

					&.selected {
						background-color: color-mix(in srgb, var(--map-style-background) 80%, #888 20%);
					}

					&[inert] {
						opacity: 0.5;
					}

					&:hover:not(:disabled) {
						background-color: color-mix(in srgb, var(--map-style-background) 70%, #888 30%);
					}
				}
			}

			.menu.pallete,
			.menu.demo {
				margin-top: 0px;
				margin-left: 20px;
				gap: 4px;
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
			z-index: 10000000;
		}

		.progess {
			position: absolute;
			top: 0px;
			left: 0px;
			width: 100%;
			height: 4px;
			overflow: hidden;
			z-index: 10000000;
		}
	}

	@media (max-width: 640px) {
		.container {
			.side {
				display: none;
			}
		}
	}

	:global {
		.maplibregl-map {
			z-index: 0;

			.maplibregl-ctrl-bottom-right {
				z-index: 10000000;

				.maplibregl-ctrl-attrib {
					font-family: 'Noto Sans';
					background-color: color-mix(in srgb, var(--map-style-background) 50%, transparent 50%);
					color: var(--map-style-text);

					a {
						color: var(--map-style-text);
						font-weight: 600;
					}
				}

				.maplibregl-ctrl-attrib:not(.maplibregl-compact) {
					font-size: 10px;
					font-weight: 500;
					line-height: normal;
					padding: 2px 5px;
					border-top-left-radius: 5px;
					box-shadow: -1px -1px 2px rgba(0, 0, 0, 0.2);

					.maplibregl-ctrl-attrib-inner {
						a {
							color: var(--map-style-text);
							font-weight: 600;
						}
					}
				}
			}
		}
	}
</style>
