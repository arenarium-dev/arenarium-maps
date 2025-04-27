<script lang="ts">
	import { page } from '$app/state';

	import Map from '$lib/client/components/Map.svelte';
	import Highlight from '$lib/client/components/Highlight.svelte';
</script>

<div class="map">
	<Map key={page.data.apiKey} />
	<div class="shadow"></div>
</div>

<div class="page">
	<div class="block">
		<div class="title">Installation</div>
		<div class="header">NPM</div>
		<div class="text">Install the package using the following command:</div>
		<div class="highlight">
			<Highlight language="bash" text={`npm install @arenarium/maps`} />
		</div>
		<div class="text">Import the package in your project and mount the map:</div>
		<div class="highlight">
			<Highlight
				language="javascript"
				text={`
import { mountMap } from '@arenarium/maps';
import '@arenarium/maps/dist/style.css';

const map = mountMap(...);`}
			/>
		</div>
		<div class="header">CDN</div>
		<div class="text">Add the following script and stylesheet to your HTML:</div>
		<div class="highlight">
			<Highlight
				language="xml"
				text={`
<script src="https://unpkg.com/@arenarium/maps@latest/dist/index.js"><\/script>
<link href="https://unpkg.com/@arenarium/maps@latest/dist/style.css" rel="stylesheet" />`}
			/>
		</div>
		<div class="text">Mount the map in your script:</div>
		<div class="highlight">
			<Highlight
				language="javascript"
				text={`
const map = arenarium.mountMap(...);
`}
			/>
		</div>
	</div>
	<div class="block">
		<div class="title">Usage</div>
		<div class="header">Initialization</div>
		<div class="text">Add a container div your HTML:</div>
		<div class="highlight">
			<Highlight language="xml" text={`<div id="map"></div>`} />
		</div>
		<div class="text">Initialize the map with options. To get the api key, sign in and create an API key.</div>
		<div class="highlight">
			<Highlight
				language="javascript"
				text={`
const map = mountMap({
	// The API key
	apiKey: '...',
	// The id of the container element
	container: 'map',
	// The initial position of the map
	position: {
		center: { lat: 51.505, lng: -0.09 },
		zoom: 13
	},
	// The restriction of the map zoom and bounds (optional)
	restriction: {
		minZoom: 10,
		maxZoom: 15,
		maxBounds: {
			sw: { lat: 48.505, lng: -3.09 },
			ne: { lat: 54.505, lng: 3.09 }
		}
	},
	// The style of the map
	style: {
		// The name of the theme used for the map
		name: 'light',
		// The colors used for the content
		colors: { primary: 'darkgreen', background: 'white', text: 'black' }
	}
});`}
			/>
		</div>
		<div class="header">Styles</div>
		<div class="text">Set the style to a predefined theme:</div>
		<div class="highlight">
			<Highlight
				language="javascript"
				text={`
map.setStyle({ name: 'dark', colors: { primary: 'purple', background: 'darkgray', text: 'black' } });`}
			/>
		</div>
		<div class="text">
			Or set the style to a custom theme with an URL to the style JSON. The JSON must comply with the <a
				href="https://maplibre.org/maplibre-style-spec/"
				target="_blank">MapLibre style specification</a
			>.
		</div>
		<div class="highlight">
			<Highlight
				language="javascript"
				text={`
map.setStyle({ 
	name: 'liberty', 
	url: 'https://tiles.openfreemap.org/styles/liberty.json', 
	colors: { primary: 'purple', background: 'white', text: 'black' }
});`}
			/>
		</div>
		<div class="header">Popups</div>
		<div class="text">Set the popup content callback function:</div>
		<div class="highlight">
			<Highlight
				language="javascript"
				text={`
map.updatePopupContentCallback(async (id) => {
	// Get the popup content and return an HTML element
    const element = await getElement(id);
    return element;
});`}
			/>
		</div>
		<div class="text">
			Update the popups. The function adds new popups and updates existing ones. It does not remove popups not specified in the
			array. It is designed to continuously update the popups on the map.
		</div>
		<div class="highlight">
			<Highlight
				language="javascript"
				text={`
import { type MapPopup } from '@arenarium/maps';

const popups: Types.Popup[] = [];

for (let i = 0; i < count; i++) {
    popups.push({
        id: ...,
        rank: ..,
        lat: ...,
        lng: ...,
        height: ...,
        width: ...
    });
}

await map.updatePopups(popups);`}
			/>
		</div>
		<div class="text">Remove all popups:</div>
		<div class="highlight">
			<Highlight
				language="javascript"
				text={`
await map.removePopups();
`}
			/>
		</div>
		<div class="header">Events</div>
		<div class="text">Subscribe to map events:</div>
		<div class="highlight">
			<Highlight
				language="javascript"
				text={`
map.on('idle', (position) => { ... });
map.on('move', (position) => { ... });
map.on('click', (coordinate) => { ... });
map.on('popup_click', (id) => { ... });
map.on('loading_start', () => { ... });
map.on('loading_end', () => { ... });`}
			/>
		</div>
		<div class="text">Unsubscribe from events:</div>
		<div class="highlight">
			<Highlight language="javascript" text={`map.off(key, handler);`} />
		</div>
		<div class="header">Position</div>
		<div class="text">Get the map position:</div>
		<div class="highlight">
			<Highlight
				language="javascript"
				text={`
const position = map.getPosition();
const bounds = map.getBounds();
const zoom = map.getZoom();
`}
			/>
		</div>
		<div class="text">Set the map position:</div>
		<div class="highlight">
			<Highlight
				language="javascript"
				text={`
map.setPosition({ center: { lat: 51.505, lng: -0.09 }, zoom: 13 });
`}
			/>
		</div>
		<div class="text">Set the map restriction:</div>
		<div class="highlight">
			<Highlight
				language="javascript"
				text={`
map.setMinZoom(10);
map.setMaxZoom(18);
map.setMaxBounds({
	sw: { lat: 51.505, lng: -0.09 },
	ne: { lat: 54.505, lng: 3.09 }
});
`}
			/>
		</div>
		<div class="title" id="about">About</div>
		<div class="text">
			@arenarium/maps aims to be the best way to show ranked popups on a map. For any situation where you need to show a large
			amount of popups on a map, where the popups are ranked by some criteria, @arenarium/maps is the best solution.
		</div>
	</div>
</div>

<style lang="less">
	.map {
		margin-bottom: 24px;
		position: relative;
		aspect-ratio: 16 / 9;
		border-radius: 8px;
		overflow: hidden;

		.shadow {
			position: absolute;
			top: 0px;
			left: 0px;
			width: 100%;
			height: 100%;
			border-radius: 8px;
			box-shadow: inset 0 0 4px 2px rgba(0, 0, 0, 0.2);
			pointer-events: none;
		}
	}

	.page {
		display: flex;
		flex-direction: column;
		gap: 24px;

		.block {
			display: flex;
			flex-direction: column;
			gap: 16px;
			color: var(--on-surface);

			.title {
				font-size: 24px;
				font-weight: 600;
				padding-bottom: 0px;
			}

			.header {
				font-size: 18px;
				font-weight: 600;
			}

			.text {
				font-size: 14px;
			}

			.text a {
				color: var(--primary);
				text-decoration: underline;
			}

			.highlight {
				padding: 0px;
				border-radius: 8px;
				border: 1px solid var(--surface-container-highest);
				overflow: hidden;
			}
		}
	}
</style>
