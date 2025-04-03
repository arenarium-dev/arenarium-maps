import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	plugins: [svelte()],
	build: {
		lib: {
			fileName: () => `index.js`,
			entry: 'src/lib/index.ts',
			name: 'arenarium',
			formats: ['umd'],
			cssFileName: 'style'
		},
		outDir: 'dist',
		emptyOutDir: true,
		minify: 'esbuild'
	}
});
