<script lang="ts">
	import Highlight from '$lib/client/components/Highlight.svelte';
</script>

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
		// The colors used for the popups and content
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
		<div class="text">Create the <code>MapPopupData</code> array:</div>
		<div class="highlight">
			<Highlight
				language="javascript"
				text={`
import { type MapPopupData } from '@arenarium/maps';

const popupData: MapPopupData[] = [];

for (let i = 0; i < count; i++) {
    popupData.push({
		// The unique ID of the popup
        id: ...,
		// The rank of the popup used when comparing with other popups
        rank: ..,
		// The latitude of the popup
        lat: ...,
		// The longitude of the popup
        lng: ...,
		// The height of the popup content body
        height: ...,
		// The width of the popup content body
        width: ...
    });
}`}
			/>
		</div>
		<div class="text">
			Use the api to get the <code>MapPopupState</code> array. To get the api key, sign in and go to the <a href="/keys">keys</a> page.
		</div>
		<div class="highlight">
			<Highlight
				language="javascript"
				text={`
import { type MapPopupState, type MapPopupStatesRequest } from '@arenarium/maps';

const body: MapPopupStatesRequest = {
	// The API key
	key: 'YOUR_API_KEY',
	// The popup data
	data: popupData,
	// The minimum zoom level of the map, optional
	minZoom: ...,
	// The maximum zoom level of the map, optional
	maxZoom: ...
};

const response = await fetch('https://arenarium.dev/api/popup/states', {
	method: 'POST',
	body: JSON.stringify(body)
});

const popupStates: MapPopupState[] = await response.json();
`}
			/>
		</div>
		<div class="text">
			Create the <code>MapPopups</code> array with the <code>MapPopupData</code> and <code>MapPopupState</code> arrays and add the content callbacks for
			the body and the pin. The callbacks should return a <code>HTMLElement</code> object. Finally update the map with the popups. The function adds new popups
			and updates existing ones. It does not remove popups not specified in the array. It is designed to continuously update the popups on the map.
		</div>
		<div class="highlight">
			<Highlight
				language="javascript"
				text={`
import { type MapPopup } from '@arenarium/maps';

const popups: MapPopup[] = [];

for (let i = 0; i < count; i++) {
    popups.push({
		data: popupData[i],
        state: popupStates[i],
        content: {
			// The body content callback, required
            bodyCallback: ...,
			// The pin content callback, optional
            pinCallback: ...
        }
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
map.on('click', (coordinate) => { ... });`}
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
			Use <strong>@arenarium/maps</strong> to effectively visualize large numbers of ranked popups on your maps. This library excels when you need to clearly
			present many location-based markers ordered according to a specific ranking or priority.
		</div>
	</div>
</div>

<style lang="less">
	.page {
		display: flex;
		flex-direction: column;
		gap: 24px;

		code {
			background-color: var(--surface-container-high);
			padding: 0px 4px;
			border-radius: 4px;
			font-weight: 600;
		}

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
