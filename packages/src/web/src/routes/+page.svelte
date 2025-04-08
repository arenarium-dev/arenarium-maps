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
    theme: 'light'
});`;
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>

<Highlight language="xml" text={headHighlight} />
<Highlight language="bash" text={bashHighlight} />
<Highlight language="javascript" text={javascriptHighlight} />
