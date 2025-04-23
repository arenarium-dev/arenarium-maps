<script lang="ts">
	import Map from '$lib/client/components/Map.svelte';
	import Highlight from '$lib/client/components/Highlight.svelte';
</script>

<div class="map">
	<Map />
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
				text={`import { mountMap } from '@arenarium/maps';
import '@arenarium/maps/dist/style.css';

const map = mountMap(...);`}
			/>
		</div>
		<div class="header">CDN</div>
		<div class="text">Add the following script and stylesheet to your HTML:</div>
		<div class="highlight">
			<Highlight
				language="xml"
				text={`<script src="https://unpkg.com/@arenarium/maps@latest/dist/index.js"><\/script>
<link href="https://unpkg.com/@arenarium/maps@latest/dist/style.css" rel="stylesheet" />`}
			/>
		</div>
		<div class="text">Mount the map in your script:</div>
		<div class="highlight">
			<Highlight language="javascript" text={`const map = arenarium.mountMap(...);`} />
		</div>
	</div>
	<div class="block">
		<div class="title">Usage</div>
		<div class="text">Add a container div your HTML:</div>
		<div class="highlight">
			<Highlight language="xml" text={`<div id="map"></div>`} />
		</div>
		<div class="text">Initialize the map with options:</div>
		<div class="highlight">
			<Highlight
				language="javascript"
				text={`const map = mountMap({
    // The id of the container element
    container: 'map',
    // The initial position of the map
    position: {
        center: { lat: 51.505, lng: -0.09 },
        zoom: 13
    },
    // The style of the map
    style: {
        // The name of the theme used for the map
        name: 'light',
        // The colors used for the popups
        colors: {
            primary: '#007bff',
            background: '#ffffff',
            text: '#000000'
        }
    }
});`}
			/>
		</div>
		<div class="text">Subscribe to map events:</div>
		<div class="highlight">
			<Highlight
				language="javascript"
				text={`map.on('click', (event) => {
    console.log(event);
});`}
			/>
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
				padding-bottom: 12px;
			}

			.header {
				font-size: 18px;
				font-weight: 600;
			}

			.text {
				font-size: 14px;
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
