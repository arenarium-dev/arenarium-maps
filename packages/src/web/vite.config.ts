import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		chunkSizeWarningLimit: 5000
	},
	plugins: [sveltekit()],
	ssr: {
		noExternal: ['@googlemaps/js-api-loader']
	}
});
