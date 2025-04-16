<script lang="ts">
	import Highlight from '$lib/client/components/Highlight.svelte';

	let headHighlight = `<script src="https://unpkg.com/@arenarium/maps@latest/dist/index.js"><\/script>
<link href="https://unpkg.com/@arenarium/maps@latest/dist/style.css" rel="stylesheet" />`;

	let bashHighlight = `npm install @arenarium/maps`;

	let javascriptHighlight = `import { mountMap } from '@arenarium/maps';

const map = mountMap({
    container: 'map',
    position: {
        center: { lat: 51.505, lng: -0.09 },
        zoom: 13
    },
	style: {
		name: 'light',
		colors: {
			primary: '#007bff',
			background: '#ffffff',
			text: '#000000'
		}
	}
});`;
</script>

<div class="page">
	<h1>Welcome to SvelteKit</h1>
	<p>
		Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation
	</p>

	<div class="highlight">
		<Highlight language="xml" text={headHighlight} />
	</div>
	<div class="highlight">
		<Highlight language="bash" text={bashHighlight} />
	</div>
	<div class="highlight">
		<Highlight language="javascript" text={javascriptHighlight} />
	</div>
</div>

<style lang="less">
	.page {
        display: flex;
        flex-direction: column;
        gap: 24px;
		padding: 24px;

		.highlight {
            padding: 0px;
			border-radius: 8px;
            border: 2px solid var(--border);
            overflow: hidden;
		}
	}
</style>
