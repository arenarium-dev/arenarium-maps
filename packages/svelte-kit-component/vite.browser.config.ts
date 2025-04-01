import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

import dts from 'vite-plugin-dts';

export default defineConfig({
	plugins: [
		svelte(),
		dts({
			rollupTypes: true,
		})
	],
	build: {
		lib: {
			fileName: (format) => `index.${format}.js`,
			entry: 'src/lib/index.ts',
			name: 'arenarium',
			formats: ['umd'],
			cssFileName: 'style'
		},
		outDir: 'dist/browser',
		emptyOutDir: true,
		minify: 'esbuild'
	}
});
