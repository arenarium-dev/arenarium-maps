import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	plugins: [svelte()],
	build: {
		lib: {
			entry: 'src/lib/index.ts',
			name: 'arenarium',
			fileName: (format, entryName) => `${entryName}.${format}.js`,
			cssFileName: 'style'
		},
		outDir: 'dist',
		emptyOutDir: true,
		minify: 'esbuild'
	}
});
