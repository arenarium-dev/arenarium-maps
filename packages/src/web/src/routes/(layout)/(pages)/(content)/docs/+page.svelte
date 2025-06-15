<script lang="ts">
	import Highlight from '$lib/client/components/Highlight.svelte';
</script>

<div class="page">
	<div class="block">
		<div class="title">Installation</div>
		<div class="header">NPM</div>
		<div class="text">To install the <code>@aranarium/maps</code> library using npm, run the following command in your project directory:</div>
		<div class="highlight">
			<Highlight language="bash" text={`npm install @arenarium/maps`} />
		</div>
		<div class="text">Import the necessary module and CSS file into your project to begin using the map:</div>
		<div class="highlight">
			<Highlight
				language="javascript"
				text={`
import { MapManager } from '@arenarium/maps';
import '@arenarium/maps/dist/style.css';

// Initialize and mount the map manager (further configuration details follow)
const mapManager = new MapManager(...);`}
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
		<div class="text">
			To initialize the map, first add a container element to your HTML where the map will be rendered. Then depending on the map library used there are
			different instructions:
		</div>
		<div class="highlight">
			<Highlight language="xml" text={`<div id="map"></div>`} />
		</div>
		<div class="header">MapLibre GL</div>
		<div class="text">
			First, install the <code>maplibre-gl</code> library:
		</div>
		<div class="highlight">
			<Highlight language="bash" text={`npm install maplibre-gl`} />
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
import { MapLibreProvider } from '@arenarium/maps/maplibre';
import '@arenarium/maps/dist/style.css';

// Create a MapLibre provider instancece
const mapLibreProvider = new MapLibreProvider(maplibregl.Map, maplibregl.Marker, {
    container: 'map',
	...
});

// Initialize the map manager with the provider
const mapManager = new MapManager('YOUR_API_KEY', mapLibreProvider);

// Access the MapLibre instance for direct map interactions
const mapLibre = mapLibreProvider.getMap();`}
			/>
		</div>
		<div class="text">You can change the map's visual appearance by setting a predefined dark or light theme:</div>
		<div class="highlight">
			<Highlight
				language="javascript"
				text={`
import { MapLibreDarkStyle, MapLibreLightStyle } from '@arenarium/maps/maplibre';

mapLibre.setStyle(MapLibreDarkStyle); // or MapLibreLightStyle
`}
			/>
		</div>
		<div class="text">
			Alternatively, you can apply a custom map style by providing a URL to a JSON file that adheres to the
			<a href="https://maplibre.org/maplibre-style-spec/" target="_blank">MapLibre Style Specification</a>. You can also override specific color
			properties within a custom style.
		</div>
		<div class="highlight">
			<Highlight language="javascript" text={`mapLibre.setStyle('https://tiles.openfreemap.org/styles/liberty.json');`} />
		</div>
		<div class="header">Google Maps</div>
		<div class="text">First, install the <code>@googlemaps/js-api-loader</code> library:</div>
		<div class="highlight">
			<Highlight language="bash" text={`npm install @googlemaps/js-api-loader`} />
		</div>
		<div class="text">To use Google Maps, you'll need to load the Google Maps JavaScript API and create a Google Maps provider instance.</div>
		<div class="highlight">
			<Highlight
				language="javascript"
				text={`
import { Loader } from '@googlemaps/js-api-loader';

import { MapManager } from '@arenarium/maps';
import { GoogleMapsProvider } from '@arenarium/maps/google';
import '@arenarium/maps/dist/style.css';

// Load Google Maps API
const loader = new Loader({
	apiKey: 'YOUR_GOOGLE_MAPS_API_KEY',
	version: 'weekly'
});

// Import required libraries
const mapsLibrary = await loader.importLibrary('maps');
const markerLibrary = await loader.importLibrary('marker');

// Create a Google Maps provider instance
const mapElement = document.getElementById('map')!;
const mapGoogleProvider = new GoogleMapsProvider(mapsLibrary.Map, markerLibrary.AdvancedMarkerElement, mapElement, {
	mapId: 'YOUR_GOOGLE_MAPS_MAP_ID', // For enabling advanced marker elements
	...
});

// Initialize the map manager with the provider
const mapManager = new MapManager('YOUR_API_KEY', mapGoogleProvider);

// Access the Google Maps instance for direct map interactions
const mapGoogle = mapGoogleProvider.getMap();
`}
			/>
		</div>
		<div class="text">
			You can change the map's visual appearance by using the predefined styles in combination with custom <code>StyledMapType</code>:
		</div>
		<Highlight
			language="javascript"
			text={`
import { GoogleMapsDarkStyle, GoogleMapsLightStyle } from '@arenarium/maps/google';

const mapTypeLight = new google.maps.StyledMapType(GoogleMapsLightStyle, { name: 'Light Map' });
const mapTypeDark = new google.maps.StyledMapType(GoogleMapsDarkStyle, { name: 'Dark Map' });

mapGoogle.mapTypes.set("light-id", mapTypeLight);
mapGoogle.mapTypes.set("dark-id", mapTypeDark);

mapGoogle.setMapTypeId("light-id"); // or "dark-id" for dark theme
`}
		/>

		<div class="header">Popups</div>
		<div class="text">
			To display interactive popups on the map, you first need to define an array of <code>MapPopup</code> objects. Provide content rendering callbacks
			for the body and optionally for the pin. These callbacks should return a <code>HTMLElement</code>. Use the
			<code>updatePopups</code> method on the map instance to display or update the popups. This method efficiently adds new popups and updates existing ones
			based on their IDs. Popups not present in the provided array will remain on the map. This approach is designed for continuous updates of map popups.
		</div>
		<div class="highlight">
			<Highlight
				language="javascript"
				text={`
import { type MapPopup } from '@arenarium/maps';

const popups: MapPopup[] = [];

for (let i = 0; i < count; i++) {
    popups.push({
        data: {
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
			// The desired padding of the popup's content area
			padding: ...
    	},
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
		<div class="text">
			To set the colors used by the map and popups, use the <code>setColors</code> method. The first argument is the primary color, the second is the background,
			and the third is the text color.
		</div>
		<div class="highlight">
			<Highlight language="javascript" text={`mapManager.setColors('darkgreen', 'white', 'black');`} />
		</div>
		<div class="text">To remove all popups from the map, use the <code>removePopups</code> method:</div>
		<div class="highlight">
			<Highlight language="javascript" text={`mapManager.removePopups();`} />
		</div>
		<div class="text">To toggle the display of popups, use the <code>togglePopups</code> method:</div>
		<div class="highlight">
			<Highlight language="javascript" text={`mapManager.togglePopups([{ id: 'id', toggled: true }]);`} />
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
