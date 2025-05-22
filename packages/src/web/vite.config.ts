import { sentrySvelteKit } from '@sentry/sveltekit';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		chunkSizeWarningLimit: 5000
	},
	plugins: [
		sentrySvelteKit({
			sourceMapsUploadOptions: {
				org: 'arenariumdev',
				project: 'arenarium-maps'
			}
		}),
		sveltekit()
	]
});
