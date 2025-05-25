<script lang="ts">
	import { mount, onDestroy, onMount } from 'svelte';
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

	import { app } from '$lib/client/state/app.svelte';
	import { Fetch } from '$lib/client/core/fetch';
	import { Demo } from '$lib/shared/demo';

	import { mountMap, type MapBounds, type MapPopup, type MapPopupData, type MapPopupState, type MapPosition, type MapStyle } from '@arenarium/maps';
	import '@arenarium/maps/dist/style.css';
	import { ca } from 'zod/v4/locales';

	let map: ReturnType<typeof mountMap>;
	let mapCreated = $state<boolean>(false);
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
					primary: 'darkgreen',
					text: 'black'
				}
			}
		});

		mapCreated = true;
	});

	onDestroy(() => {
		app.toast.set(null);
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

	//#region Style

	let style = $state<string>('website');

	$effect(() => {
		if (app.ready && app.theme.get() && map) {
			setTimeout(() => {
				if (style == 'website') {
					setStyleWebsite();
				}
			});
		}
	});

	function onStyleWebsiteClick() {
		setStyleWebsite();
		style = 'website';
	}

	function onStyleLightClick() {
		setStyleLight();
		style = 'light';
	}

	function onStyleDarkClick() {
		setStyleDark();
		style = 'dark';
	}

	function onStyleCustomClick() {
		setStyleCustom();
		style = 'custom';
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
				primary: 'darkgreen',
				text: 'black'
			}
		});
	}

	function setStyleDark() {
		map?.setStyle({
			name: 'dark',
			colors: {
				background: 'var(--surface)',
				primary: 'lightgreen',
				text: 'var(--on-surface)'
			}
		});
	}

	function setStyleCustom() {
		map?.setStyle({
			name: 'custom',
			url: 'https://tiles.openfreemap.org/styles/liberty',
			colors: {
				background: 'white',
				primary: 'blue',
				text: 'black'
			}
		});
	}

	//#endregion

	//#region Demo

	let demo = $state<Demo>(page.params.demo as Demo);

	let demoPopupData = new Map<string, MapPopupData>();
	let demoPopupDataLoaded = false;
	let demoAutoUpdate = $state<boolean>(false);

	$effect(() => {
		if (mapCreated) {
			map.on('load', () => {
				onMapLoadDemo();
			});

			map.on('idle', () => {
				onMapIdleDemo();
			});
		}
	});

	$effect(() => {
		if (mapCreated && demo != page.params.demo) {
			demo = page.params.demo as Demo;
			setTimeout(async () => {
				await onMapLoadDemo();
				await onMapIdleDemo();
			});
		}
	});

	async function onMapLoadDemo() {
		// Update style
		const demoStyle = getDemoStyle(demo);
		if (demoStyle) {
			map.setStyle(demoStyle);
			style = 'custom';
		}

		const demoRestriction = getDemoPosition(demo);
		if (demoRestriction) {
			map.setCenter(demoRestriction.center);
			map.setMinZoom(demoRestriction.zoom);
		}

		// Update data
		demoPopupData.clear();
		demoPopupDataLoaded = false;

		map.removePopups();
	}

	async function onMapIdleDemo() {
		const bounds = map.getBounds();
		await processBoundsChange(bounds);
	}

	function onDemoAutoUpdateClick(e: Event) {
		e.stopPropagation();
		demoAutoUpdate = !demoAutoUpdate;
	}

	async function processBoundsChange(bounds: MapBounds) {
		try {
			loading = true;

			const dataDelta = await getPopupDataDelta(bounds);
			if (dataDelta.length === 0) return;

			if (demoAutoUpdate || demoPopupData.size === 0) {
				await processPopupDataDelta(dataDelta);
				return;
			}

			app.toast.set({
				path: `/${demo}`,
				text: `Load ${dataDelta.length} new popups?`,
				severity: 'info',
				callback: {
					name: 'Yes',
					function: async () => {
						await processPopupDataDelta(dataDelta);
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

	async function getPopupDataDelta(bounds: MapBounds): Promise<MapPopupData[]> {
		if (demoPopupDataLoaded) return [];

		switch (demo) {
			case Demo.CityExpert: {
				demoPopupDataLoaded = true;
				break;
			}
		}

		const { width, height } = getPopupDimensions();

		const params = new URLSearchParams();
		params.append('total', '128');
		params.append('swlat', bounds.sw.lat.toString());
		params.append('swlng', bounds.sw.lng.toString());
		params.append('nelat', bounds.ne.lat.toString());
		params.append('nelng', bounds.ne.lng.toString());
		params.append('width', width.toString());
		params.append('height', height.toString());

		const allPopupData = await Fetch.that<MapPopupData[]>(`/api/popup/${demo}/data?${params}`);
		const newPopupData = new Array<MapPopupData>();
		for (const data of allPopupData) {
			if (!demoPopupData.has(data.id)) {
				newPopupData.push(data);
			}
		}
		return newPopupData;
	}

	async function processPopupDataDelta(dataDelta: MapPopupData[]) {
		try {
			loading = true;

			// Update the loaded data
			dataDelta.forEach((d) => demoPopupData.set(d.id, d));

			// Get the new states
			const statePopupData = Array.from(demoPopupData.values());
			const states = await Fetch.that<MapPopupState[]>(`/api/popup/states`, {
				method: 'POST',
				body: statePopupData
			});

			// Create the new popups
			const popups = new Array<MapPopup>();
			for (let i = 0; i < states.length; i++) {
				const popup: MapPopup = {
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
			await map.updatePopups(popups);
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

	function getDemoStyle(demo: Demo): MapStyle | undefined {
		switch (demo) {
			case Demo.SrbijaNekretnine: {
				return {
					name: 'custom',
					url: 'https://tiles.openfreemap.org/styles/bright',
					colors: {
						background: 'white',
						primary: '#ff4400',
						text: 'black'
					}
				};
			}
			case Demo.CityExpert: {
				return {
					name: 'custom',
					url: 'demo/cityexpert.style.json',
					colors: {
						background: 'white',
						primary: 'red',
						text: 'black'
					}
				};
			}
		}
	}

	function getDemoPosition(demo: Demo): MapPosition | undefined {
		switch (demo) {
			case Demo.SrbijaNekretnine: {
				return {
					center: { lat: 44.811222, lng: 20.450989 },
					zoom: 12
				};
			}
			case Demo.CityExpert: {
				return {
					center: { lat: 44.811222, lng: 20.450989 },
					zoom: 10
				};
			}
		}
	}

	function getPopupDimensions(): { width: number; height: number } {
		switch (demo) {
			default:
				return { width: 64, height: 64 };
			case Demo.Rentals:
				return { width: 128, height: 104 };
			case Demo.SrbijaNekretnine:
				return { width: 156, height: 128 };
			case Demo.CityExpert:
				return { width: 156, height: 128 };
		}
	}

	async function getPopupBody(id: string): Promise<HTMLElement> {
		return await new Promise((resolve) => {
			const popup = demoPopupData.get(id);
			if (!popup) throw new Error('Popup not found');

			const element = document.createElement('div');
			switch (demo) {
				default:
					mount(BasicPopup, { target: element, props: { id, width: popup.width, height: popup.height } });
					break;
				case Demo.Rentals:
					mount(RentalPopup, { target: element, props: { id, lat: popup.lat, lng: popup.lng } });
					break;
				case Demo.SrbijaNekretnine:
					mount(SrbijaNekretninePopup, { target: element, props: { id, width: popup.width, height: popup.height } });
					break;
			}
			resolve(element);
		});
	}

	async function getPopupPin(id: string): Promise<HTMLElement> {
		return await new Promise((resolve) => {
			const element = document.createElement('div');
			switch (demo) {
				case Demo.Rentals:
					mount(RentalPin, { target: element, props: { id } });
					break;
			}
			resolve(element);
		});
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
	<div id="map"></div>

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
							<button class="item" onclick={onPalleteClick} disabled={getDemoStyle(demo) != undefined}>
								<Icon name={'palette'} size={22} />
								<span>Style</span>
								<Icon name={'arrow_right'} />
							</button>
						{/snippet}
						{#snippet menu()}
							<div class="menu pallete shadow-large">
								<button class="item" class:selected={style == 'website'} onclick={onStyleWebsiteClick}>Website</button>
								<button class="item" class:selected={style == 'light'} onclick={onStyleLightClick}>Light</button>
								<button class="item" class:selected={style == 'dark'} onclick={onStyleDarkClick}>Dark</button>
								<button class="item" class:selected={style == 'custom'} onclick={onStyleCustomClick}>Custom</button>
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
</div>

<Toast />

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
			flex-direction: column;
			align-items: start;
			gap: 12px;

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
				background-color: var(--surface);

				.item {
					width: 100%;
					display: flex;
					align-items: center;
					gap: 8px;
					padding: 8px;
					font-weight: 600;
					font-size: 13px;
					border-radius: 12px;
					cursor: pointer;
					transition: all 125ms ease-in-out;

					span {
						flex-grow: 1;
						text-align: start;
					}

					&.selected {
						background-color: var(--surface-container);
					}

					&[inert] {
						opacity: 0.5;
					}

					&:hover:not(:disabled) {
						background-color: var(--surface-container-high);
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
