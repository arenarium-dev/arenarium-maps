# Arenarium Maps

## Installation

```bash
npm install @arenarium/maps
```

```script
<script src="https://unpkg.com/@arenarium/maps@latest/dist/index.js"></script>
<link href="https://unpkg.com/@arenarium/maps@latest/dist/style.css" rel="stylesheet"/>
```

## Usage

```web
<html lang="en">
	<head>
		<script src="https://unpkg.com/@arenarium/maps@latest/dist/index.js"></script>
		<link href="https://unpkg.com/@arenarium/maps@latest/dist/style.css" rel="stylesheet"/>
	</head>
	<body>
		<div id="map"></div>
		<script>
            const map = arenarium.mountMap({
				container: 'map',
				position: {
					center: { lat: 51.505, lng: -0.09 },
					zoom: 13
				},
				theme: 'light'
			});
        </script>
	</body>
</html>
```

```svelte
<script lang="ts">
	import { onMount } from 'svelte';

	import { mountMap } from '$lib/index.js';

	onMount(() => {
		mountMap({
			container: 'map',
			position: {
				center: { lat: 51.505, lng: -0.09 },
				zoom: 13
			},
			theme: 'light'
		});
	});
</script>

<div id="map"></div>
```

## License

[MIT](LICENSE)
