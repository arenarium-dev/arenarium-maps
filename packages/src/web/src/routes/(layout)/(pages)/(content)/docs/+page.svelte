<script lang="ts">
	import Highlight from '$lib/client/components/Highlight.svelte';
</script>

<div class="page">
	<div class="block">
		<div class="title">Installation</div>
		<div class="header">NPM</div>
		<div class="text">To install the <code>@aranarium/maps</code> library using npm, run the following command in your project directory:</div>
		<div class="highlight">
			<Highlight language="bash" text={`npm install maplibre-gl @arenarium/maps`} />
		</div>
		<div class="text">Import the necessary module and CSS file into your project to begin using the map:</div>
		<div class="highlight">
			<Highlight
				language="javascript"
				text={`
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import * as arenarium from '@arenarium/maps';
import '@arenarium/maps/dist/style.css';

// Initialize and mount the map manager (further configuration details follow)
const mapManager = new arenarium.MapManager(...);`}
			/>
		</div>
		<div class="header">CDN</div>
		<div class="text">
			To include <code>@aranarium/maps</code> directly in your HTML via a Content Delivery Network (CDN), add these script and stylesheet tags to the
			<code>{'<head>'}</code> or <code>{'<body>'}</code> of your HTML document:
		</div>
		<div class="highlight">
			<Highlight
				language="xml"
				text={`
<script src="https://unpkg.com/maplibre-gl@^5.6.0/dist/maplibre-gl.js"><\/script>
<link href="https://unpkg.com/maplibre-gl@^5.6.0/dist/maplibre-gl.css" rel="stylesheet" \/>

<script src="https://unpkg.com/@arenarium/maps@^1.0.124/dist/index.js"><\/script>
<link href="https://unpkg.com/@arenarium/maps@^1.0.124/dist/style.css" rel="stylesheet" \/>`}
			/>
		</div>
		<div class="text">Once included, you can access the library's functions through the global <code>arenarium</code> object to mount the map:</div>
		<div class="highlight">
			<Highlight
				language="javascript"
				text={`
// Initialize and mount the map manager (further configuration details follow)
const mapManager = new arenarium.MapManager(...);
`}
			/>
		</div>
	</div>
	<div class="block">
		<div class="title">Usage</div>
		<div class="header">Initialization</div>
		<div class="text">To initialize the map, first add a container element to your HTML where the map will be rendered:</div>
		<div class="highlight">
			<Highlight language="xml" text={`<div id="map"></div>`} />
		</div>
		<div class="text">
			Next, use the <code>MapManager</code> class which requires a <code>maplibre.Map</code> class, a <code>maplibre.Marker</code> class and a
			<code>MapOptions</code> object.
		</div>
		<div class="highlight">
			<Highlight
				language="javascript"
				text={`
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import { MapManager } from '@arenarium/maps';
import '@arenarium/maps/dist/style.css';

// The map manager used for managing the map popups
const mapManager = new MapManager(maplibregl.Map, maplibregl.Marker, {
    container: 'map',
    center: { lat: 51.505, lng: -0.09 },
    zoom: 13,
	...
});

// The maplibre instance used for interacting with the map
const mapLibre = mapManager.maplibre;`}
			/>
		</div>
		<div class="header">Styles</div>
		<div class="text">
			To set the colors used by the map and popups, use the <code>setColors</code> method. The first argument is the primary color, the second is the background,
			and the third is the text color.
		</div>
		<div class="highlight">
			<Highlight language="javascript" text={`mapManager.setColors('darkgreen', 'white', 'black');`} />
		</div>
		<div class="text">You can change the map's visual appearance by setting a predefined dark or light theme:</div>
		<div class="highlight">
			<Highlight language="javascript" text={`mapLibre.setStyle(arenarium.MapDarkStyle);`} />
		</div>
		<div class="text">
			Alternatively, you can apply a custom map style by providing a URL to a JSON file that adheres to the
			<a href="https://maplibre.org/maplibre-style-spec/" target="_blank">MapLibre Style Specification</a>. You can also override specific color
			properties within a custom style.
		</div>
		<div class="highlight">
			<Highlight language="javascript" text={`mapLibre.setStyle('https://tiles.openfreemap.org/styles/liberty.json');`} />
		</div>

		<div class="header">Popups</div>
		<div class="text">To display interactive popups on the map, you first need to define an array of <code>MapPopupData</code> objects:</div>
		<div class="highlight">
			<Highlight
				language="javascript"
				text={`
import { type MapPopupData } from '@arenarium/maps';

const popupData: MapPopupData[] = [];

for (let i = 0; i < count; i++) {
    popupData.push({
        // A unique identifier for the popup
        id: ...,
        // The ranking of the popup, used for visual prioritization
        rank: ..,
        // The latitude of the popup's location
        lat: ...,
        // The longitude of the popup's location
        lng: ...,
        // The desired height of the popup's content area
        height: ...,
        // The desired width of the popup's content area
        width: ...
    });
}`}
			/>
		</div>
		<div class="text">
			Next, retrieve the dynamic state information for these popups using the API. You will need your API key, which can be found on your <a href="/keys"
				>API Keys</a
			> page after signing in.
		</div>
		<div class="highlight">
			<Highlight
				language="javascript"
				text={`
import { type MapPopupState, type MapPopupStatesRequest } from '@arenarium/maps';

const body: MapPopupStatesRequest = {
    // Your Arenarium API key
    key: 'YOUR_API_KEY',
    // The array of popup data
    data: popupData,
};

const response = await fetch('https://arenarium.dev/api/public/v1/popup/states', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
});

const popupStates: MapPopupState[] = await response.json();
`}
			/>
		</div>
		<div class="text">
			Finally, combine the <code>MapPopupData</code> and <code>MapPopupState</code> arrays to create an array of <code>MapPopup</code> objects. For each
			popup, provide content rendering callbacks for the body and optionally for a custom pin. These callbacks should return a <code>HTMLElement</code>.
			Use the <code>updatePopups</code> method on the map instance to display or update the popups. This method efficiently adds new popups and updates existing
			ones based on their IDs. Popups not present in the provided array will remain on the map. This approach is designed for continuous updates of map popups.
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
        callbacks: {
            // Callback function that returns the HTMLElement object for the popup body (required)
            body: async (id) => { ... }
            // Optional: Callback function that returns the HTMLElement object for a custom pin
            pin: async (id) => { ... }
        }
    });
}

await mapManager.updatePopups(popups);`}
			/>
		</div>
		<div class="text">To remove all popups from the map, use the <code>removePopups</code> method:</div>
		<div class="highlight">
			<Highlight language="javascript" text={`await mapManager.removePopups();`} />
		</div>
		<div class="text">To toggle the display of popups, use the <code>togglePopups</code> method:</div>
		<div class="highlight">
			<Highlight language="javascript" text={`await mapManager.togglePopups([{ id: 'id', toggled: true }]);`} />
		</div>
		<div class="title" id="about">About</div>
		<div class="text">
			<strong>@arenarium/maps</strong> is a library designed for the efficient visualization of a large number of ranked points of interest on your maps. It
			excels in scenarios where you need to present numerous location-based markers with a clear visual hierarchy based on their importance or ranking. By
			leveraging optimized rendering techniques and a dedicated API for managing dynamic popup states, this library ensures a smooth and informative user experience.
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
