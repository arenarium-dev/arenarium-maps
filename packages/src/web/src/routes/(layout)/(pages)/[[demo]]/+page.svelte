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
	import BookingsPopup from '$lib/client/components/demo/bookings/Popup.svelte';
	import BookingsPin from '$lib/client/components/demo/bookings/Pin.svelte';
	import SrbijaNekretninePopup from '$lib/client/components/demo/srbija-nekretnine/Popup.svelte';
	import CityExpertPopup from '$lib/client/components/demo/cityexpert/Popup.svelte';
	import CityExpertPin from '$lib/client/components/demo/cityexpert/Pin.svelte';

	import { app } from '$lib/client/state/app.svelte';
	import { Fetch } from '$lib/client/core/fetch';
	import {
		Demo,
		getDemoColors,
		getDemoConfiguration,
		getDemoName,
		getDemoPosition,
		getPopupDimensions,
		isDemoCustom,
		type DemoMap,
		type DemoSize,
		type DemoStyle
	} from '$lib/shared/demo';

	import { MapManager, type MapPopup, type MapPopupData, type MapProvider } from '@arenarium/maps';
	import '@arenarium/maps/dist/style.css';

	interface Bounds {
		sw: { lat: number; lng: number };
		ne: { lat: number; lng: number };
	}

	let mounted = $state<boolean>(false);

	let mapManager: MapManager;
	let mapProvider: MapProvider;
	let mapElement: HTMLElement;

	let mapZoom = $state<number>(0);
	let mapLoaded = $state<boolean>(false);

	let demoSize: DemoSize = 'large';
	let demoMap = $state<DemoMap>((page.url.searchParams.get('map') as DemoMap) ?? 'maplibre');
	let demoStyle = $state<DemoStyle>('website');
	let demo = $state<Demo>(page.params.demo as Demo);

	let popupData = new Map<string, MapPopupData>();
	let dataLoaded = false;
	let dataLoading = $state<boolean>(false);
	let dataAutoUpdate = $state<boolean>(false);
	let dataTogglePopups = $state<boolean>(true);

	onMount(() => {
		demoSize = window.innerWidth < 640 ? 'small' : 'large';

		mounted = true;
	});

	//#region MapLibre

	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';

	import { MapLibreProvider, MapLibreDarkStyle, MapLibreStyleLight } from '@arenarium/maps/maplibre';

	let mapLibre: maplibregl.Map;
	let mapLibreProvider: MapLibreProvider;

	function loadMapLibre() {
		mapLibreProvider = new MapLibreProvider(maplibregl.Map, maplibregl.Marker, {
			container: mapElement,
			style: app.theme.get() == 'dark' ? MapLibreDarkStyle : MapLibreStyleLight,
			center: { lat: 51.505, lng: -0.09 },
			zoom: 4
		});

		mapProvider = mapLibreProvider;
		mapLibre = mapLibreProvider.getMap();

		mapLibre.on('load', () => {
			mapLoaded = true;
		});
		mapLibre.on('move', (e) => {
			mapZoom = mapLibre.getZoom();
		});
		mapLibre.on('idle', () => {
			onMapIdle();
		});
	}

	function setMapLibreStyle(demo: Demo, style: DemoStyle) {
		mapLibre.setStyle(getMapLibreStyle(demo, style));
	}

	function getMapLibreStyle(demo: Demo, style: DemoStyle): string | maplibregl.StyleSpecification {
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
						return app.theme.get() == 'dark' ? MapLibreDarkStyle : MapLibreStyleLight;
					}
					case 'light': {
						return MapLibreStyleLight;
					}
					case 'dark': {
						return MapLibreDarkStyle;
					}
					case 'default': {
						return 'https://tiles.openfreemap.org/styles/liberty';
					}
				}
			}
		}
	}

	function setMapLibrePosition(demo: Demo) {
		const demoRestriction = getDemoPosition(demo);
		mapLibre.setMinZoom(demoRestriction.zoom);
		mapLibre.setCenter([demoRestriction.lng, demoRestriction.lat]);
	}

	function getMapLibreBounds(): Bounds {
		const bounds = mapLibre.getBounds();
		return {
			sw: { lat: bounds.getSouthWest().lat, lng: bounds.getSouthWest().lng },
			ne: { lat: bounds.getNorthEast().lat, lng: bounds.getNorthEast().lng }
		};
	}

	//#endregion

	//#region Google Maps

	import { GoogleMapDarkStyle, GoogleMapLightStyle, GoogleMapsProvider } from '@arenarium/maps/google';

	import { Loader } from '@googlemaps/js-api-loader';

	let mapGoogle: google.maps.Map;
	let mapGoogleProvider: GoogleMapsProvider;

	let mapTypeLightId = 'light-id';
	let mapTypeDarkId = 'dark-id';

	async function loadGoogleMaps() {
		// Load API and map
		const loader = new Loader({
			apiKey: 'AIzaSyCt6ERDLY4Hx5b6LEBQFPYJbRq9teByXyk',
			version: 'weekly'
		});

		const mapsLibrary = await loader.importLibrary('maps');
		const markerLibrary = await loader.importLibrary('marker');

		mapGoogleProvider = new GoogleMapsProvider(mapsLibrary.Map, markerLibrary.AdvancedMarkerElement, mapElement, {
			mapId: '11b85640a5094a146ed5dd8f',
			center: { lat: 51.505, lng: -0.09 },
			zoom: 4,
			disableDefaultUI: true,
			isFractionalZoomEnabled: true,
			colorScheme: google.maps.ColorScheme.LIGHT
		});

		mapProvider = mapGoogleProvider;

		mapGoogle = mapGoogleProvider.getMap();
		// Set events
		mapGoogle.addListener('tilesloaded', () => {
			mapLoaded = true;
		});
		mapGoogle.addListener('zoom_changed', () => {
			mapZoom = mapGoogle.getZoom()!;
		});
		mapGoogle.addListener('idle', () => {
			onMapIdle();
		});

		// Set map type
		const mapTypeLight = new google.maps.StyledMapType(GoogleMapLightStyle, { name: 'Light Map' });
		const mapTypeDark = new google.maps.StyledMapType(GoogleMapDarkStyle, { name: 'Dark Map' });

		mapGoogle.mapTypes.set(mapTypeLightId, mapTypeLight);
		mapGoogle.mapTypes.set(mapTypeDarkId, mapTypeDark);
	}

	function setGoogleMapsStyle(demo: Demo, style: DemoStyle) {
		switch (style) {
			case 'default':
				mapGoogle.setOptions({
					mapTypeId: 'roadmap',
					styles: null
				});
				break;
			case 'website':
				mapGoogle.setMapTypeId(app.theme.get() == 'dark' ? mapTypeDarkId : mapTypeLightId);
				break;
			case 'light':
				mapGoogle.setMapTypeId(mapTypeLightId);
				break;
			case 'dark':
				mapGoogle.setMapTypeId(mapTypeDarkId);
				break;
		}
	}

	function setGoogleMapsPosition(demo: Demo) {
		const demoRestriction = getDemoPosition(demo);
		mapGoogle.setOptions({ minZoom: demoRestriction.zoom });
		mapGoogle.setCenter({ lat: demoRestriction.lat, lng: demoRestriction.lng });
	}

	function getGoogleMapsBounds(): Bounds {
		const bounds = mapGoogle.getBounds();
		return {
			sw: { lat: bounds?.getSouthWest().lat() ?? 0, lng: bounds?.getSouthWest().lng() ?? 0 },
			ne: { lat: bounds?.getNorthEast().lat() ?? 0, lng: bounds?.getNorthEast().lng() ?? 0 }
		};
	}

	//#endregion

	//#region Map Change

	onMount(async () => {
		try {
			switch (demoMap) {
				case 'maplibre': {
					loadMapLibre();
					break;
				}
				case 'google': {
					await loadGoogleMaps();
					break;
				}
			}

			mapManager = new MapManager('KEY', mapProvider);
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

	function onDemoMapClick(map: DemoMap) {
		window.location.search = `?map=${map}`;
	}

	//#endregion

	//#region Style Change

	let colorPrimary = $state<string>();
	let colorBackground = $state<string>();
	let colorText = $state<string>();

	$effect(() => {
		if (mapLoaded) {
			// Update style
			switch (demoMap) {
				case 'maplibre': {
					setMapLibreStyle(demo, demoStyle);
					break;
				}
				case 'google': {
					setGoogleMapsStyle(demo, demoStyle);
					break;
				}
			}

			// Update colors
			const demoColors = getDemoColors(demo, demoStyle);
			colorPrimary = demoColors.primary;
			colorBackground = demoColors.background;
			colorText = demoColors.text;
			mapManager.setColors(demoColors.primary, demoColors.background, demoColors.text);
		}
	});

	//#endregion

	//#region Data Change

	$effect(() => {
		if (mapLoaded && demo != page.params.demo) {
			demo = page.params.demo as Demo;
		}
	});

	$effect(() => {
		if (mapLoaded) {
			// Update position
			switch (demoMap) {
				case 'maplibre': {
					setMapLibrePosition(demo);
					break;
				}
				case 'google': {
					setGoogleMapsPosition(demo);
					break;
				}
			}

			// Update configuration
			mapManager.configuration = getDemoConfiguration(demo);

			// Update data
			onDemoClear();
			onDataRefresh();
		}
	});

	async function onMapIdle() {
		if (dataAutoUpdate && !dataLoaded) {
			onBoundsChange(getDataBounds());
		}
	}

	function onDemoClear() {
		popupData.clear();
		dataLoaded = false;
		mapManager?.removePopups();
	}

	async function onDataRefresh() {
		onBoundsChange(getDataBounds());
	}

	function onDataAutoUpdateClick(e: Event) {
		e.stopPropagation();
		dataAutoUpdate = !dataAutoUpdate;
	}

	function onTogglePopupsClick(e: Event) {
		e.stopPropagation();

		dataTogglePopups = !dataTogglePopups;
		mapManager.togglePopups(Array.from(popupData.values()).map((p) => ({ id: p.id, toggled: dataTogglePopups })));
	}

	async function onBoundsChange(bounds: Bounds) {
		try {
			dataLoading = true;

			switch (demo) {
				case Demo.CityExpert: {
					dataLoaded = true;
					break;
				}
			}

			// Get new popup data
			const { width, height, padding } = getPopupDimensions(demo, demoSize);
			const params = new URLSearchParams();
			params.append('total', '128');
			params.append('width', width.toString());
			params.append('height', height.toString());
			params.append('padding', padding.toString());
			params.append('swlat', bounds.sw.lat.toString());
			params.append('swlng', bounds.sw.lng.toString());
			params.append('nelat', bounds.ne.lat.toString());
			params.append('nelng', bounds.ne.lng.toString());

			const allPopupData = await Fetch.that<MapPopupData[]>(`/api/popup/${demo}/data?${params}`);
			const newPopupData = new Array<MapPopupData>();
			for (const data of allPopupData) {
				if (!popupData.has(data.id)) {
					newPopupData.push(data);
					popupData.set(data.id, data);
				}
			}
			if (newPopupData.length === 0) return;

			// Create popups
			const popups = new Array<MapPopup>();

			for (const data of popupData.values()) {
				const popup: MapPopup = {
					data: data,
					callbacks: {
						body: getPopupBody,
						pin: getPopupPin
					}
				};
				popups.push(popup);
			}

			// Update the popups
			await mapManager.updatePopups(popups);
			mapManager.togglePopups(popups.map((p) => ({ id: p.data.id, toggled: dataTogglePopups })));
		} catch (err) {
			console.error(err);
			app.toast.set({
				path: '/',
				text: 'Failed to process popups.',
				severity: 'error',
				seconds: 2
			});
		} finally {
			dataLoading = false;
		}
	}

	async function getPopupBody(id: string): Promise<HTMLElement> {
		return await new Promise((resolve) => {
			const popup = popupData.get(id);
			if (!popup) throw new Error('Popup not found');

			const element = document.createElement('div');

			switch (demo) {
				default:
					mount(BasicPopup, { target: element, props: { id, width: popup.width, height: popup.height } });
					break;
				case Demo.Rentals:
					mount(RentalPopup, { target: element, props: { id, width: popup.width, height: popup.height } });
					break;
				case Demo.Bookings:
					mount(BookingsPopup, { target: element, props: { id, width: popup.width, height: popup.height } });
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
			const popup = popupData.get(id) as any;
			if (!popup) throw new Error('Popup not found');

			const element = document.createElement('div');

			switch (demo) {
				case Demo.Rentals:
					mount(RentalPin, { target: element, props: { id } });
					break;
				case Demo.Bookings:
					mount(BookingsPin, { target: element, props: { id } });
					break;
				case Demo.CityExpert:
					mount(CityExpertPin, { target: element, props: { id, type: popup.type } });
					break;
			}
			resolve(element);
		});
	}

	function getDataBounds(): Bounds {
		switch (demoMap) {
			case 'maplibre': {
				return getMapLibreBounds();
			}
			case 'google': {
				return getGoogleMapsBounds();
			}
		}
	}

	//#endregion

	//#region Side

	function onZoomIn() {
		switch (demoMap) {
			case 'maplibre': {
				mapLibre?.zoomIn();
				break;
			}
			case 'google': {
				mapGoogle?.setZoom(mapGoogle.getZoom()! + 1);
				break;
			}
		}
	}

	function onZoomOut() {
		switch (demoMap) {
			case 'maplibre': {
				mapLibre?.zoomOut();
				break;
			}
			case 'google': {
				mapGoogle?.setZoom(mapGoogle.getZoom()! - 1);
				break;
			}
		}
	}

	//#endregion
</script>

<div class="container" style="--map-style-background: {colorBackground}; --map-style-text: {colorText}; --map-style-primary: {colorPrimary}">
	<div class="map" bind:this={mapElement}></div>
	{#if mapLoaded}
		{#if isDemoCustom(demo) == false}
			<div class="top">
				<Menu axis={'x'}>
					{#snippet button()}
						<button class="button shadow-small">
							<Icon name={'map'} size={22} />
							<span class="text">Map</span>
						</button>
					{/snippet}
					{#snippet menu()}
						<div class="menu maps shadow-large">
							<button class="item" class:selected={demoMap == 'maplibre'} onclick={() => onDemoMapClick('maplibre')}>MapLibre</button>
							<button class="item" class:selected={demoMap == 'google'} onclick={() => onDemoMapClick('google')}>Google</button>
						</div>
					{/snippet}
				</Menu>
				<Menu axis={'x'}>
					{#snippet button()}
						<button class="button shadow-small">
							<Icon name={'palette'} size={22} />
							<span class="text">Style</span>
						</button>
					{/snippet}
					{#snippet menu()}
						<div class="menu pallete shadow-large">
							<button class="item" class:selected={demoStyle == 'website'} onclick={() => (demoStyle = 'website')}>Website</button>
							<button class="item" class:selected={demoStyle == 'light'} onclick={() => (demoStyle = 'light')}>Light</button>
							<button class="item" class:selected={demoStyle == 'dark'} onclick={() => (demoStyle = 'dark')}>Dark</button>
							<button class="item" class:selected={demoStyle == 'default'} onclick={() => (demoStyle = 'default')}>Default</button>
						</div>
					{/snippet}
				</Menu>
				<Menu axis={'x'}>
					{#snippet button()}
						<button class="button shadow-small">
							<Icon name={'database'} size={22} />
							<span class="text">Data</span>
						</button>
					{/snippet}
					{#snippet menu()}
						<div class="menu demo shadow-large">
							<a href="/" class="item" class:selected={page.params.demo == undefined}> Basic </a>
							<a href="/{Demo.Rentals}" class="item" class:selected={page.params.demo == Demo.Rentals}>{getDemoName(Demo.Rentals)}</a>
							<a href="/{Demo.Bookings}" class="item" class:selected={page.params.demo == Demo.Bookings}>{getDemoName(Demo.Bookings)}</a>
							<a href="/{Demo.News}" class="item" inert>{getDemoName(Demo.News)}</a>
							<a href="/{Demo.Events}" class="item" inert>{getDemoName(Demo.Events)}</a>
						</div>
					{/snippet}
				</Menu>
				<Menu axis={'x'}>
					{#snippet button()}
						<div class="button shadow-small">
							<Icon name={'tune'} size={22} />
							<span class="text">Tune</span>
						</div>
					{/snippet}
					{#snippet menu()}
						<div class="menu options shadow-large">
							<button class="item" onclick={onDataAutoUpdateClick}>
								<Icon name={dataAutoUpdate ? 'check_box' : 'check_box_outline_blank'} size={22} />
								<span>Auto Load</span>
							</button>
							<button class="item" onclick={onTogglePopupsClick}>
								<Icon name={dataTogglePopups ? 'check_box' : 'check_box_outline_blank'} size={22} />
								<span>Show Popups</span>
							</button>
						</div>
					{/snippet}
				</Menu>
			</div>
		{/if}

		<div class="side">
			<button class="button shadow-small" onmousedown={onDataRefresh}>
				<Icon name={'refresh'} size={22} />
			</button>
			<button class="button shadow-small" onmousedown={onZoomIn}>
				<Icon name={'add'} size={22} />
			</button>
			<button class="button shadow-small" onmousedown={onZoomOut}>
				<Icon name={'remove'} size={22} />
			</button>
		</div>

		{#if dataLoading}
			<div class="progess" transition:fade={{ duration: 125, delay: 50 }}>
				<Progress />
			</div>
		{/if}
	{/if}
</div>

<Toast path="/" />

<style lang="less">
	.container {
		position: relative;
		flex-grow: 1;

		.map {
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
				gap: 4px;
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

			.menu.maps {
				margin-top: 0px;
				margin-left: 10px;
			}

			.menu.pallete {
				margin-top: 0px;
				margin-left: 8px;
			}

			.menu.demo {
				margin-top: 0px;
				margin-left: 8px;
			}

			.menu.options {
				margin-top: 0px;
				margin-left: 8px;
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
				bottom: 64px;
			}

			.top {
				.button {
					width: 36px;
					justify-content: center;
					padding: 0px;

					.text {
						display: none;
					}
				}

				.menu {
					margin-left: 8px !important;
				}
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
