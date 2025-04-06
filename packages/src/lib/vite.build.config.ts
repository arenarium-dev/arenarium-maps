import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	plugins: [svelte()],
	build: {
		lib: {
			entry: 'src/lib/index.ts',
			name: 'arenarium',
			formats: ['es', 'umd'],
			fileName: 'index',
			cssFileName: 'style'
		}
	}
});
