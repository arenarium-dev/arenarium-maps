import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

import path from "path";

export default defineConfig({
	resolve: {
		alias: {
			$lib: path.resolve(__dirname, '../../src/lib')
		}
	},
	plugins: [svelte()],
	build: {
		lib: {
			entry: 'src/lib/index.ts',
			name: 'arenarium',
			formats: ['umd'],
			fileName: () => 'index.js',
			cssFileName: 'index'
		},
		emptyOutDir: false
	}
});
