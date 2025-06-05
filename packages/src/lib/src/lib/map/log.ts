import { dev } from '$app/environment';
import type { Log } from '@workspace/shared/src/types.js';

export async function log(title: string, content: any) {
	// if (dev) return;

	try {
		const log: Log = {
			title,
			content
		};

		await fetch('https://arenarium.dev/api/public/v1/log?log=' + encodeURIComponent(JSON.stringify(log)));
	} catch (error) {
		console.error(error);
	}
}
