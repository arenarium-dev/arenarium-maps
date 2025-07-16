# Installation

## NPM

To install the `@aranarium/maps` library using npm, run the following command in your project directory:

```
npm install @arenarium/maps
```

Import the necessary module and CSS file into your project to begin using the map:

```
import { MapManager } from '@arenarium/maps';
import '@arenarium/maps/dist/style.css';

// Initialize and mount the map manager (further configuration details follow)
const mapManager = new MapManager(...);
```

## CDN

To include `@aranarium/maps` directly in your HTML via a Content Delivery Network (CDN), add these script and stylesheet tags to the `<head>` or `<body>` of your HTML document:

```
<script src="https://unpkg.com/maplibre-gl@^5.6.0/dist/maplibre-gl.js"></script>
<link href="https://unpkg.com/maplibre-gl@^5.6.0/dist/maplibre-gl.css" rel="stylesheet" />

<script src="https://unpkg.com/@arenarium/maps@^1.0.124/dist/index.js"></script>
<link href="https://unpkg.com/@arenarium/maps@^1.0.124/dist/style.css" rel="stylesheet" />
```

Once included, you can access the library's functions through the global `arenarium` object to mount the map:

```
// Initialize and mount the map manager (further configuration details follow)
const mapManager = new arenarium.MapManager(...);
```

# Usage

## Initialization

To initialize the map, first add a container element to your HTML where the map will be rendered. Then depending on the map library used there are different instructions:

```
<div id="map"></div>
```

## Maplibre GL

First, install the `maplibre-gl` library:

```
npm install maplibre-gl
```

Next, use the `MapManager` class which requires a `maplibre.Map` class, a `maplibre.Marker` class and a `MapOptions` object.

```
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import { MapManager } from '@arenarium/maps';
import { MapLibreProvider } from '@arenarium/maps/maplibre';
import '@arenarium/maps/dist/style.css';

// Create a maplibre provider instance
const maplibreProvider = new MapLibreProvider(maplibregl.Map, maplibregl.Marker, {
    container: 'map',
    ...
});

// Initialize the map manager with the provider
const mapManager = new MapManager(maplibreProvider);

// Access the maplibre instance for direct map interactions
const maplibreMap = mapLibreProvider.getMap();
```

You can change the map's visual appearance by setting a predefined dark or light theme:

```
import { MaplibreDarkStyle, MaplibreLightStyle } from '@arenarium/maps/maplibre';

maplibreMap.setStyle(MaplibreDarkStyle); // or MaplibreLightStyle
```

Alternatively, you can apply a custom map style by providing a URL to a JSON file that adheres to the [MapLibre Style Specification](https://maplibre.org/maplibre-style-spec/). You can also override specific color properties within a custom style.

```
mapLibre.setStyle('https://tiles.openfreemap.org/styles/liberty.json');
```

## Mapbox GL

First, install the `mapbox-gl` library:

```
npm install mapbox-gl
```

Next, use the `MapManager` class which requires a `mapbox.Map` class, a `mapbox.Marker` class and a `MapOptions` object.

```
import mapbox from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import { MapManager } from '@arenarium/maps';
import { MapboxProvider } from '@arenarium/maps/mapbox';
import '@arenarium/maps/dist/style.css';

// Create a mapbox provider instance
const mapboxProvider = new MapboxProvider(mapbox.Map, mapbox.Marker, {
    container: 'map',
    ...
});

// Initialize the map manager with the provider
const mapManager = new MapManager(mapboxProvider);

// Access the mapbox instance for direct map interactions
const mapboxMap = mapboxProvider.getMap();
```

## Google Maps

First, install the `@googlemaps/js-api-loader` library:

```
npm install @googlemaps/js-api-loader
```

To use Google Maps, you'll need to load the Google Maps JavaScript API and create a Google Maps provider instance.

```
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
const mapManager = new MapManager(mapGoogleProvider);

// Access the Google Maps instance for direct map interactions
const mapGoogle = mapGoogleProvider.getMap();
```

You can change the map's visual appearance by using the predefined styles in combination with custom `StyledMapType`:

```
import { GoogleMapsDarkStyle, GoogleMapsLightStyle } from '@arenarium/maps/google';

const mapTypeLight = new google.maps.StyledMapType(GoogleMapsLightStyle, { name: 'Light Map' });
const mapTypeDark = new google.maps.StyledMapType(GoogleMapsDarkStyle, { name: 'Dark Map' });

mapGoogle.mapTypes.set("light-id", mapTypeLight);
mapGoogle.mapTypes.set("dark-id", mapTypeDark);

mapGoogle.setMapTypeId("light-id"); // or "dark-id" for dark theme
```

## Markers

A marker consist of a pin, a tooltip and an optional popup. The pin is an element that should convey the marker's location and and basic information like an icon or a color. The tooltip is an element that should provide additional information thats needs to be readable, it could be small or large amount of information depending on the application. The popup is an element that should be displayed when the user clicks on the marker. It should contain additional information thats not necessary or too large for a tooltip.

The markers toogle between the pin and the tooltip elements as the user zoom in. The pin is displayed when there is no room for the tooltip. When the user zooms in and more space is available, more tooltips are displayed. Which tooltips are displayed first is determined by the ranking of the markers. The higher the rank, the sooner the tooltip is displayed.

To add markers to the map, you first need to define an array of `MapMarker` objects. Provide the base marker data and the configuration for the tooltip, pin and popup. The configurations have body callbacks which should return a `HTMLElement`.

Use the `updateMarkers` method on the map manager to display or update update the markers. This method adds new markers and updates existing ones based on their IDs. Markers not present in the provided array will remain on the map. This approach is designed for continuous updates of map markers.

```
import { type MapMarker } from '@arenarium/maps';

const markers: MapMarker[] = [];

for (let i = 0; i < count; i++) {
    markers.push({
        // A unique identifier for the marker
        id: ...,
        // The ranking of the marker, used for prioritization
        rank: ..,
        // The latitude of the marker's location
        lat: ...,
        // The longitude of the marker's location
        lng: ...,
        // The tooltip configuration of the marker (required)
        tooltip: {          
            style: {
                // The desired height of the marker's tooltip area
                height: ...,
                // The desired width of the marker's tooltip area
                width: ...
                // The desired margin of the marker's tooltip area
                margin: ...,
                // The desired radius of the marker's tooltip area
                radius: ...,
            },
            // Callback function that returns the HTMLElement object for the tooltip body
            body: async (id) => { ... }             
        },
        // The pin configuration of the marker (optional)
        pin: {
            style: {
                // The desired height of the marker's pin area
                height: ...,
                // The desired width of the marker's pin area
                width: ...
                // The desired radius of the marker's pin area
                radius: ...,
            },
            // Callback function that returns the HTMLElement object for the pin body
            body: async (id) => { ... }
        },
        // The popup configuration of the marker (optional)
        popup: {
            style: {
                // The desired height of the marker's popup area
                height: ...,
                // The desired width of the marker's popup area
                width: ...
                // The desired margin of the marker's popup area
                margin: ...,
                // The desired radius of the marker's popup area
                radius: ...,
            },
            // Callback function that returns the HTMLElement object for the popup body
            body: async (id) => { ... }
        }
    });
}

await mapManager.updateMarkers(markers);
```

To remove all markers from the map, use the `removeMarkers` method:

```
mapManager.removeMarkers();
```

To toggle the popup of a marker, use the `showPopup` and `hidePopup` methods:

```
mapManager.showPopup(id);
mapManager.hidePopup(id);
```

## Style

You can change the markers style by using the predefined CSS variables:

```
--arenarium-maps-pin-background: ...;
--arenarium-maps-pin-border: ...;
--arenarium-maps-pin-shadow: ...;

--arenarium-maps-tooltip-background: ...;           
--arenarium-maps-tooltip-shadow: ...;
--arenarium-maps-tooltip-shadow-hover: ...;
```

# Examples

[https://github.com/arenarium-dev/arenarium-maps-svelte-kit-example](https://github.com/arenarium-dev/arenarium-maps-svelte-kit-example)

# About

**@arenarium/maps** is a library designed for the efficient visualization of a large number of ranked points of interest on your maps. It excels in scenarios where you need to present numerous location-based markers with a clear visual hierarchy based on their importance or ranking. By leveraging optimized rendering techniques and a dedicated API for managing dynamic marker states, this library ensures a smooth and informative user experience.

# Docs

https://arenarium.dev/docs

# License

[MIT](LICENSE)
