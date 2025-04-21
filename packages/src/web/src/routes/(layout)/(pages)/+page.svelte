<script lang="ts">
	import Highlight from '$lib/client/components/Highlight.svelte';

	let moduleInstallHighlight = `npm install @arenarium/maps`;

	let moduleMountHighlight = `import { mountMap } from '@arenarium/maps';
import '@arenarium/maps/dist/style.css';

const map = mountMap(...);`;

	let cdnInstallHighlight = `<script src="https://unpkg.com/@arenarium/maps@latest/dist/index.js"><\/script>
<link href="https://unpkg.com/@arenarium/maps@latest/dist/style.css" rel="stylesheet" />`;

	let cdnMountHighlight = `const map = arenarium.mountMap(...);`;

	let mountJavascriptHighlight = `const map = mountMap({
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
});`;

	let mountHtmlHighlight = `<div id="map"></div>`;
</script>

<div class="page">
	<div class="block">
		<div class="title">Installation</div>
		<div class="header">NPM</div>
		<div class="text">Install the package using the following command:</div>
		<div class="highlight">
			<Highlight language="bash" text={moduleInstallHighlight} />
		</div>
		<div class="text">Import the package in your project and mount the map:</div>
		<div class="highlight">
			<Highlight language="javascript" text={moduleMountHighlight} />
		</div>
		<div class="header">CDN</div>
		<div class="text">Add the following script and stylesheet to your HTML:</div>
		<div class="highlight">
			<Highlight language="xml" text={cdnInstallHighlight} />
		</div>
		<div class="text">Mount the map in your script:</div>
		<div class="highlight">
			<Highlight language="javascript" text={cdnMountHighlight} />
		</div>
	</div>
	<div class="block">
		<div class="title">Usage</div>
		<div class="text">Initialize the map with options:</div>
		<div class="highlight">
			<Highlight language="javascript" text={mountJavascriptHighlight} />
		</div>
		<div class="highlight">
			<Highlight language="xml" text={mountHtmlHighlight} />
		</div>
	</div>
</div>

<style lang="less">
	.page {
		display: flex;
		flex-direction: column;
		gap: 24px;
		padding: 24px;

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
				border: 1px solid var(--outline-variant);
				overflow: hidden;
			}
		}
	}
</style>
