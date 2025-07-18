import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import dts from 'vite-plugin-dts';
import path from 'path';

export default defineConfig({
	resolve: {
		alias: {
			$lib: path.resolve(__dirname, '../../src/lib')
		}
	},
	plugins: [
		svelte(),
		dts({
			rollupTypes: true,
			insertTypesEntry: true,
			entryRoot: 'src/lib',
			copyDtsFiles: true,
			exclude: ['**/.svelte-kit/**', '**/node_modules/**']
		})
	],
	build: {
		lib: {
			entry: {
				main: './src/lib/main.ts',
				maplibre: './src/lib/maplibre.ts',
				mapbox: './src/lib/mapbox.ts',
				google: './src/lib/google.ts',
				utils: './src/lib/utils.ts'
			},
			name: 'arenarium',
			formats: ['es', 'cjs'],
			fileName: (format, entryName) => `${entryName}.${format}.js`,
			cssFileName: 'style'
		}
	}
});
