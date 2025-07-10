<script lang="ts">
	import { mount, onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	import Icon from '$lib/client/components/utils/Icon.svelte';
	import Menu from '$lib/client/components/utils/Menu.svelte';
	import Progress from '$lib/client/components/utils/Progress.svelte';
	import Toast from '$lib/client/components/utils/Toast.svelte';

	import SocialTooltip from './components/social/Tooltip.svelte';
	import RentalTooltip from './components/rentals/Tooltip.svelte';
	import RentalPin from './components/rentals/Pin.svelte';
	import BookingsPin from './components/bookings/Pin.svelte';
	import BookingsTooltip from './components/bookings/Tooltip.svelte';
	import BookingsPopup from './components/bookings/Popup.svelte';
	import BnbTooltip from './components/bnb/Tooltip.svelte';
	import BnbPopup from './components/bnb/Popup.svelte';
	import SrbijaNekretnineTooltip from './components/websites/srbija-nekretnine/Tooltip.svelte';
	import CityExpertTooltip from './components/websites/cityexpert/Tooltip.svelte';
	import CityExpertPin from './components/websites/cityexpert/Pin.svelte';
	import BookawebTooltip from './components/websites/bookaweb/Tooltip.svelte';
	import BookawebPin from './components/websites/bookaweb/Pin.svelte';
	import RoommateorTooltip from './components/websites/roommateor/Tooltip.svelte';
	import RoommateorPopup from './components/websites/roommateor/Popup.svelte';

	import { app } from '$lib/client/state/app.svelte';
	import { Fetch } from '$lib/client/core/fetch';
	import {
		DemoMapSchema,
		DemoStyleSchema,
		getDemoAutoUpdate,
		getDemoColors,
		getDemoConfiguration,
		getDemoName,
		getDemoPosition,
		getPinDimensions,
		getPopupDimensions,
		getTooltipDimensions,
		isDemoCustom,
		type Demo,
		type DemoMap,
		type DemoSize,
		type DemoStyle
	} from '$lib/shared/demo';

	import { MapManager, type MapMarker, type MapProvider } from '@arenarium/maps';
	import '@arenarium/maps/dist/style.css';

	interface Bounds {
		sw: { lat: number; lng: number };
		ne: { lat: number; lng: number };
	}

	let mapManager: MapManager;
	let mapProvider: MapProvider;
	let mapElement: HTMLElement;
	let mapLoaded = $state<boolean>(false);

	let demo = $derived<Demo>((page.params.demo as Demo) ?? 'social');
	let demoSize: DemoSize = 'large';
	let demoMap = $derived<DemoMap>(DemoMapSchema.safeParse(page.url.searchParams.get('map')).data ?? 'maplibre');
	let demoStyle = $derived<DemoStyle>(DemoStyleSchema.safeParse(page.url.searchParams.get('style')).data ?? 'website');

	let dataMarkers = new Map<string, MapMarker>();
	let dataDetails = new Map<string, any>();

	let dataLoaded = false;
	let dataLoading = $state<boolean>(false);
	let dataAutoUpdate = $state<boolean>(false);

	onMount(() => {
		demoSize = window.innerWidth < 640 ? 'small' : 'large';
	});

	//#region MapLibre

	import { MapLibreProvider, MapLibreDarkStyle, MapLibreLightStyle } from '@arenarium/maps/maplibre';

	let mapLibre: maplibregl.Map;
	let mapLibreProvider: MapLibreProvider;

	async function loadMapLibre() {
		const maplibregl = await import('maplibre-gl');
		await import('maplibre-gl/dist/maplibre-gl.css');

		mapLibreProvider = new MapLibreProvider(maplibregl.Map, maplibregl.Marker, {
			container: mapElement,
			style: app.theme.get() == 'dark' ? MapLibreDarkStyle : MapLibreLightStyle,
			center: { lat: 51.505, lng: -0.09 },
			zoom: 4
		});

		mapProvider = mapLibreProvider;
		mapLibre = mapLibreProvider.getMap();
		mapLibre.doubleClickZoom.disable();

		mapLibre.on('load', () => {
			mapLoaded = true;
		});
		mapLibre.on('idle', () => {
			onMapIdle();
		});
		mapLibre.on('click', () => {
			onMapClick();
		});
	}

	function setMapLibreStyle(demo: Demo, style: DemoStyle) {
		mapLibre.setStyle(getMapLibreStyle(demo, style));
	}

	function getMapLibreStyle(demo: Demo, style: DemoStyle): string | maplibregl.StyleSpecification {
		switch (demo) {
			case 'srbija-nekretnine': {
				return 'https://tiles.openfreemap.org/styles/bright';
			}
			case 'cityexpert': {
				return 'demo/cityexpert.style.json';
			}
			case 'bookaweb': {
				return 'https://tiles.openfreemap.org/styles/positron';
			}
			case 'roommateor': {
				return 'https://tiles.openfreemap.org/styles/positron';
			}
			default: {
				switch (style) {
					case 'website': {
						return app.theme.get() == 'dark' ? MapLibreDarkStyle : MapLibreLightStyle;
					}
					case 'light': {
						return MapLibreLightStyle;
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
		mapGoogle.addListener('tilesloaded', () => {
			mapLoaded = true;
		});
		mapGoogle.addListener('idle', () => {
			onMapIdle();
		});
		mapGoogle.addListener('click', () => {
			onMapClick();
		});

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
					await loadMapLibre();
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
		}
	});

	function onDemoStyleClick(style: DemoStyle) {
		const searchParams = page.url.searchParams;
		searchParams.set('style', style);
		goto(`/${demo == 'social' ? '' : demo}?${searchParams.toString()}`);
	}

	//#endregion

	//#region Data Change

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

			// Update auto update
			dataAutoUpdate = getDemoAutoUpdate(demo);

			// Update data
			onDataClear();
			onDataRefresh();
		}
	});

	async function onMapIdle() {
		if (dataAutoUpdate && !dataLoaded) {
			onBoundsChange(getDataBounds());
		}
	}

	function onMapClick() {
		mapManager.hidePopup();
	}

	function onDataClear() {
		dataMarkers.clear();
		dataLoaded = false;
		mapManager.removeMarkers();
	}

	async function onDataRefresh() {
		onBoundsChange(getDataBounds());
	}

	function onDataAutoUpdateClick(e: Event) {
		e.stopPropagation();
		dataAutoUpdate = !dataAutoUpdate;
	}

	async function onBoundsChange(bounds: Bounds) {
		try {
			dataLoading = true;

			switch (demo) {
				case 'cityexpert': {
					dataLoaded = true;
					break;
				}
			}
			getTooltipDimensions;
			// Get new marker data

			const params = new URLSearchParams();
			params.append('demo', demo);
			params.append('total', '128');
			params.append('swlat', bounds.sw.lat.toString());
			params.append('swlng', bounds.sw.lng.toString());
			params.append('nelat', bounds.ne.lat.toString());
			params.append('nelng', bounds.ne.lng.toString());

			const tooltipData = await Fetch.that<any[]>(`/api/demo/data?${params}`);
			if (tooltipData.length === 0) return;

			// Create markers
			const markers = new Array<MapMarker>();

			for (const data of tooltipData) {
				const marker: MapMarker = {
					id: data.id,
					rank: data.rank,
					lat: data.lat,
					lng: data.lng,
					tooltip: { style: getTooltipDimensions(demo, demoSize, data.id), body: getTooltipBody },
					pin: { style: getPinDimensions(demo, demoSize), body: getPinBody },
					popup: getPopupDimensions(demo, demoSize) ? { style: getPopupDimensions(demo, demoSize)!, body: getPopupBody } : undefined
				};
				markers.push(marker);

				dataMarkers.set(data.id, marker);
				dataDetails.set(data.id, data.details);
			}

			// Update the markers
			await mapManager.updateMarkers(markers);
		} catch (err) {
			console.error(err);
			app.toast.set({
				path: '/',
				text: 'Failed to process markers.',
				severity: 'error',
				seconds: 2
			});
		} finally {
			dataLoading = false;
		}
	}

	function onPopupClick(id: string) {
		switch (demo) {
			case 'bookings':
			case 'bnb':
			case 'roommateor': {
				mapManager.showPopup(id);
				break;
			}
		}
	}

	async function getPinBody(id: string): Promise<HTMLElement> {
		const marker = dataMarkers.get(id);
		const details = dataDetails.get(id);
		if (!marker) throw new Error('Marker not found');

		const element = document.createElement('div');
		const dimestions = marker.pin?.style;

		switch (demo) {
			case 'rentals':
				mount(RentalPin, { target: element, props: { id, width: dimestions?.width ?? 0, height: dimestions?.height ?? 0 } });
				break;
			case 'bookings':
				mount(BookingsPin, { target: element, props: { id, width: dimestions?.width ?? 0, height: dimestions?.height ?? 0 } });
				break;
			case 'cityexpert':
				mount(CityExpertPin, { target: element, props: { id, type: details.type } });
				break;
			case 'bookaweb':
				mount(BookawebPin, { target: element, props: { id, price: details.price } });
				break;
		}

		return element;
	}

	async function getTooltipBody(id: string): Promise<HTMLElement> {
		const marker = dataMarkers.get(id);
		const details = dataDetails.get(id);
		if (!marker) throw new Error('Marker not found');

		const element = document.createElement('div');
		element.addEventListener('click', (e) => {
			e.stopPropagation();
			onPopupClick(id);
		});

		const dimestions = marker.tooltip.style;

		switch (demo) {
			case 'social':
				const lines = 2 + (Number.parseInt(id) % 3);
				mount(SocialTooltip, { target: element, props: { id, lines, width: dimestions.width, height: dimestions.height, details } });
				break;
			case 'rentals':
				mount(RentalTooltip, { target: element, props: { id, width: dimestions.width, height: dimestions.height } });
				break;
			case 'bookings':
				mount(BookingsTooltip, { target: element, props: { id, width: dimestions.width, height: dimestions.height } });
				break;
			case 'bnb':
				mount(BnbTooltip, { target: element, props: { id, width: dimestions.width, height: dimestions.height } });
				break;
			case 'srbija-nekretnine':
				mount(SrbijaNekretnineTooltip, { target: element, props: { id, width: dimestions.width, height: dimestions.height } });
				break;
			case 'cityexpert':
				mount(CityExpertTooltip, { target: element, props: { id, width: dimestions.width, height: dimestions.height } });
				break;
			case 'bookaweb':
				mount(BookawebTooltip, { target: element, props: { id, width: dimestions.width, height: dimestions.height, data: (marker as any).details } });
				break;
			case 'roommateor':
				mount(RoommateorTooltip, { target: element, props: { price: details.price, width: dimestions.width, height: dimestions.height } });
				break;
		}

		return element;
	}

	async function getPopupBody(id: string): Promise<HTMLElement> {
		const marker = dataMarkers.get(id);
		const details = dataDetails.get(id);
		if (!marker) throw new Error('Marker not found');

		const element = document.createElement('div');
		const dimestions = marker.popup?.style;
		if (!dimestions) throw new Error('Popup not found');

		switch (demo) {
			case 'bookings':
				mount(BookingsPopup, { target: element, props: { id, width: dimestions.width, height: dimestions.height } });
				break;
			case 'bnb':
				mount(BnbPopup, { target: element, props: { id, width: dimestions?.width ?? 0, height: dimestions?.height ?? 0 } });
				break;
			case 'roommateor':
				mount(RoommateorPopup, { target: element, props: { details, width: dimestions?.width ?? 0, height: dimestions?.height ?? 0 } });
				break;
		}

		return element;
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
				<Menu>
					{#snippet button()}
						<button class="button shadow-small">
							<Icon name={'database'} size={22} />
							<span class="text">Demo:</span>
							<span class="value">{getDemoName(demo)}</span>
						</button>
					{/snippet}
					{#snippet menu()}
						<div class="menu demo shadow-large">
							<a href="/?{page.url.searchParams}" class="item" class:selected={demo == undefined}>{getDemoName('social')}</a>
							<a href="/rentals?{page.url.searchParams}" class="item" class:selected={demo == 'rentals'}>{getDemoName('rentals')}</a>
							<a href="/bookings?{page.url.searchParams}" class="item" class:selected={demo == 'bookings'}>{getDemoName('bookings')}</a>
							<a href="/bnb?{page.url.searchParams}" class="item" class:selected={demo == 'bnb'}>{getDemoName('bnb')}</a>
							<a href="/news?{page.url.searchParams}" class="item" inert>{getDemoName('news')}</a>
							<a href="/events?{page.url.searchParams}" class="item" inert>{getDemoName('events')}</a>
						</div>
					{/snippet}
				</Menu>
				<Menu>
					{#snippet button()}
						<button class="button shadow-small">
							<Icon name={'map'} size={22} />
							<span class="text">Map:</span>
							<span class="value">{demoMap.charAt(0).toUpperCase() + demoMap.slice(1)}</span>
						</button>
					{/snippet}
					{#snippet menu()}
						<div class="menu maps shadow-large">
							<button class="item" class:selected={demoMap == 'maplibre'} onclick={() => onDemoMapClick('maplibre')}>Maplibre</button>
							<button class="item" class:selected={demoMap == 'google'} onclick={() => onDemoMapClick('google')}>Google</button>
						</div>
					{/snippet}
				</Menu>
				<Menu>
					{#snippet button()}
						<button class="button shadow-small">
							<Icon name={'palette'} size={22} />
							<span class="text">Style:</span>
							<span class="value">{demoStyle.charAt(0).toUpperCase() + demoStyle.slice(1)}</span>
						</button>
					{/snippet}
					{#snippet menu()}
						<div class="menu pallete shadow-large">
							<button class="item" class:selected={demoStyle == 'website'} onclick={() => onDemoStyleClick('website')}>Website</button>
							<button class="item" class:selected={demoStyle == 'light'} onclick={() => onDemoStyleClick('light')}>Light</button>
							<button class="item" class:selected={demoStyle == 'dark'} onclick={() => onDemoStyleClick('dark')}>Dark</button>
							<button class="item" class:selected={demoStyle == 'default'} onclick={() => onDemoStyleClick('default')}>Default</button>
						</div>
					{/snippet}
				</Menu>
				<Menu>
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
		:global {
			--arenarium-maps-pin-background: var(--map-style-primary);
			--arenarium-maps-pin-border: var(--map-style-background);

			.tooltip {
				--arenarium-maps-tooltip-background: color-mix(in srgb, var(--map-style-background) 100%, var(--map-style-primary) 0%);
			}

			.popup {
				--arenarium-maps-tooltip-background: var(--map-style-background);
			}
		}

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
			flex-direction: row;
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

				.text {
					opacity: 0.75;
				}
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
					font-size: 14px;
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

			.menu.demo {
				margin-top: 8px;
				margin-left: 81px;
			}

			.menu.maps {
				margin-top: 8px;
				margin-left: 70px;
			}

			.menu.pallete {
				margin-top: 8px;
				margin-left: 74px;
			}

			.menu.options {
				margin-top: 8px;
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

					.text,
					.value {
						display: none;
					}
				}

				.menu {
					margin-left: 0px !important;
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
