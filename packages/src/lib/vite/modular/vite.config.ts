import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	plugins: [svelte()],
	build: {
		lib: {
			entry: {
				main: './src/lib/main.ts',
				maplibre: './src/lib/maplibre.ts'
			},
			name: 'arenarium',
			formats: ['es', 'cjs'],
			fileName: (format, entryName) => `${entryName}.${format}.js`,
			cssFileName: 'style'
		},
		emptyOutDir: false
	}
});
