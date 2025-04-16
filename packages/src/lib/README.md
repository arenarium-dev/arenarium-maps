## Usage

#### Web

```html
<html lang="en">
    <head>
        <script src="https://unpkg.com/@arenarium/maps@latest/dist/index.js"></script>
        <link href="https://unpkg.com/@arenarium/maps@latest/dist/style.css" rel="stylesheet" />
    </head>
    <body>
        <div id="map"></div>
        <script>
            const map = arenarium.mountMap({
                // Id of the HTML element that contains the map,
                container: 'map'
                // The initial position and zoomof the map
                position: {
                    center: { lat: 51.505, lng: -0.09 },
                    zoom: 13
                },
                // The initial style of the map
                style: {
                    name: 'light',
                    colors: {
                        primary: '#007bff',
                        background: '#fff',
                        text: '#000'
                    }
                }
            });
        </script>
    </body>
</html>
```

#### Svelte

```bash
npm install @arenarium/maps
```

```svelte
<script lang="ts">
    import { onMount } from 'svelte';
    import { mountMap } from '$lib/index.js';

    onMount(() => {
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
                    background: '#fff',
                    text: '#000'
                }
            }
        });
    });
</script>

<div id="map"></div>
```

## License

[MIT](LICENSE)
