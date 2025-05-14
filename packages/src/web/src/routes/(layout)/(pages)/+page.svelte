<script lang="ts">
	import { mount, onDestroy, onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	import Icon from '$lib/client/components/utils/Icon.svelte';
	import Menu from '$lib/client/components/utils/Menu.svelte';
	import Progress from '$lib/client/components/utils/Progress.svelte';
	import Toast from '$lib/client/components/Toast.svelte';

	import BasicPopup from '$lib/client/components/demo/basic/Popup.svelte';
	import RentalPopup from '$lib/client/components/demo/rentals/Popup.svelte';
	import RentalPin from '$lib/client/components/demo/rentals/Pin.svelte';

	import { app } from '$lib/client/state/app.svelte';
	import { Fetch } from '$lib/client/core/fetch';

	import { mountMap, type MapBounds, type MapPopup, type MapPopupData, type MapPopupState } from '@arenarium/maps';
	import '@arenarium/maps/dist/style.css';
	import { page } from '$app/state';

	let map: ReturnType<typeof mountMap>;
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

		map.on('idle', () => {
			onMapIdle();
		});
	});

	onDestroy(() => {
		app.toast.set(null);
	});

	//#region Tune

	let palleteMenuComponent = $state<ReturnType<typeof Menu>>();
	let sourceMenuComponent = $state<ReturnType<typeof Menu>>();

	function onPalleteClick(e: Event) {
		e.stopPropagation();
		palleteMenuComponent?.show();
		sourceMenuComponent?.hide();
	}

	function onSourceClick(e: Event) {
		e.stopPropagation();
		palleteMenuComponent?.hide();
		sourceMenuComponent?.show();
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

	type Source = 'basic' | 'rentals' | 'events' | 'news';
	let sourceHash = page.url.hash.slice(1) as Source;
	let sources: Source[] = ['basic', 'rentals', 'events', 'news'];

	let source = $state<'basic' | 'rentals' | 'events' | 'news'>(sources.includes(sourceHash) ? sourceHash : 'basic');
	let sourceAutoUpdate = $state<boolean>(false);
	let sourcePopupData = new Map<string, MapPopupData>();

	function onMapIdle() {
		const bounds = map.getBounds();
		processBoundsChange(bounds);
	}

	async function onSourceSelect(value: Source) {
		source = value;
		sourcePopupData.clear();

		window.location.hash = value.toLowerCase();

		await clearData();

		const bounds = map.getBounds();
		processBoundsChange(bounds);
	}

	function onSourceAutoUpdateClick(e: Event) {
		e.stopPropagation();
		sourceAutoUpdate = !sourceAutoUpdate;
	}

	async function processBoundsChange(bounds: MapBounds) {
		try {
			loading = true;

			const data = await getPopupData(bounds);
			const dataDelta = getPopupDataDelta(data);
			if (dataDelta.length === 0) return;

			if (sourceAutoUpdate || sourcePopupData.size === 0) {
				await processPopupDataDelta(dataDelta);
				return;
			}

			app.toast.set({
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
				text: 'Failed to process popups.',
				severity: 'error',
				seconds: 2
			});
		} finally {
			loading = false;
		}
	}

	async function clearData() {
		if (!map) return;

		map.removePopups();
	}

	async function getPopupData(bounds: MapBounds): Promise<MapPopupData[]> {
		const { width, height } = getPopupDimensions();

		const params = new URLSearchParams();
		params.append('total', '128');
		params.append('swlat', bounds.sw.lat.toString());
		params.append('swlng', bounds.sw.lng.toString());
		params.append('nelat', bounds.ne.lat.toString());
		params.append('nelng', bounds.ne.lng.toString());
		params.append('width', width.toString());
		params.append('height', height.toString());

		const data = await Fetch.that<MapPopupData[]>(`/api/popup/data?${params}`);
		return data;
	}

	function getPopupDataDelta(data: MapPopupData[]) {
		const newPopupData = new Array<MapPopupData>();
		for (const d of data) {
			if (!sourcePopupData.has(d.id)) {
				newPopupData.push(d);
			}
		}
		return newPopupData;
	}

	async function processPopupDataDelta(dataDelta: MapPopupData[]) {
		try {
			loading = true;

			// Update the loaded data
			dataDelta.forEach((d) => sourcePopupData.set(d.id, d));

			// Get the new states
			const statePopupData = Array.from(sourcePopupData.values());
			const states = await Fetch.that<MapPopupState[]>(`/api/popup/states`, {
				method: 'POST',
				body: statePopupData
			});
			console.log('Loaded states:', states.length);

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
				text: 'Failed to get popup state.',
				severity: 'error',
				seconds: 2
			});
		} finally {
			loading = false;
		}
	}

	function getPopupDimensions(): { width: number; height: number } {
		switch (source) {
			case 'basic':
				return { width: 48, height: 48 };
			case 'rentals':
				return { width: 128, height: 104 };
			default:
				throw new Error('Invalid source');
		}
	}

	async function getPopupBody(id: string): Promise<HTMLElement> {
		return await new Promise((resolve) => {
			const popup = sourcePopupData.get(id);
			if (!popup) throw new Error('Popup not found');

			const element = document.createElement('div');
			switch (source) {
				case 'basic':
					mount(BasicPopup, { target: element, props: { id } });
					break;
				case 'rentals':
					mount(RentalPopup, { target: element, props: { id, lat: popup.lat, lng: popup.lng } });
					break;
			}
			resolve(element);
		});
	}

	async function getPopupPin(id: string): Promise<HTMLElement> {
		return await new Promise((resolve) => {
			const element = document.createElement('div');
			switch (source) {
				case 'rentals':
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
					<span>{source.charAt(0).toUpperCase() + source.slice(1)}</span>
				</div>
			{/snippet}
			{#snippet menu()}
				<div class="menu shadow-large">
					<Menu axis={'x'} bind:this={palleteMenuComponent}>
						{#snippet button()}
							<button class="item" onclick={onPalleteClick}>
								<Icon name={'palette'} size={22} />
								<span>{style.charAt(0).toUpperCase() + style.slice(1)}</span>
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
					<Menu axis={'x'} bind:this={sourceMenuComponent}>
						{#snippet button()}
							<button class="item" onclick={onSourceClick}>
								<Icon name={'database'} size={22} />
								<span>{source.charAt(0).toUpperCase() + source.slice(1)}</span>
								<Icon name={'arrow_right'} />
							</button>
						{/snippet}
						{#snippet menu()}
							<div class="menu source shadow-large">
								<button class="item" class:selected={source == 'basic'} onclick={() => onSourceSelect('basic')}>Basic</button>
								<button class="item" class:selected={source == 'rentals'} onclick={() => onSourceSelect('rentals')}>Rentals</button>
								<button class="item" class:selected={source == 'events'} disabled onclick={() => onSourceSelect('events')}>Events</button>
								<button class="item" class:selected={source == 'news'} disabled onclick={() => onSourceSelect('news')}>News</button>
							</div>
						{/snippet}
					</Menu>
					<button class="item" onclick={onSourceAutoUpdateClick}>
						<Icon name={sourceAutoUpdate ? 'check_box' : 'check_box_outline_blank'} size={22} />
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

					&:disabled {
						opacity: 0.5;
					}

					&:hover:not(:disabled) {
						background-color: var(--surface-container-high);
					}
				}
			}

			.menu.pallete,
			.menu.source {
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
